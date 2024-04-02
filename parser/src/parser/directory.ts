import fs from 'fs'
import { ParserError, ParserWarning, SkipFile, printWarning } from 'parser'
import { parseFile } from 'parser/file'
import { FileInfo } from 'parser/file-info'
import { getMetadata, shouldSkipFile } from 'parser/metadata'
import { isDirectoryMetadata } from 'parser/metadata.guard'

import type { DirectoryDTO, FilesystemNodeChildDTO } from 'unix-core'

export async function parseDirectory(parent: FileInfo | null, directoryPath: string): Promise<DirectoryDTO> {
    const metadata = getMetadata(`${directoryPath}/`, isDirectoryMetadata) ?? {}
    if (shouldSkipFile(metadata)) {
        throw new SkipFile()
    }

    const directory = new FileInfo(parent, directoryPath, metadata.displayName)
    directory.setFlagIfTrue('isHomeDir', metadata.isHomeDir)
    directory.setFlagIfTrue('isCommandDir', metadata.isCommandDir)

    return {
        type: 'directory',
        name: parent === null ? 'ROOT' : directory.name,
        accessType: metadata.accessType,
        children: await parseChildren(directory) // eslint-disable-line @typescript-eslint/no-use-before-define
    }
}

async function parseChildren(directory: FileInfo): Promise<FilesystemNodeChildDTO[]> {
    const children = fs.readdirSync(directory.realPath).map(name => `${directory.realPath}/${name}`)
    const childDirectories = children.filter(path => fs.statSync(path).isDirectory())
    const results: FilesystemNodeChildDTO[] = []
    await Promise.all(children.map(async path => {
        try {
            if (childDirectories.includes(path)) {
                results.push(await parseDirectory(directory, path))
            } else {
                results.push(await parseFile(directory, path))
            }
        } catch (e) {
            if (e instanceof SkipFile) {
                // Skip silently 
            } else if (e instanceof ParserWarning) {
                printWarning(e.message)
            } else if (e instanceof ParserError) {
                console.error(e.message)
            } else {
                console.error(`Failed to parse '${path}':`)
                console.error(e)
            }
        }
    }))
    return results
}
