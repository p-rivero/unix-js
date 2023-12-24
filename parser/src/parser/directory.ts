import fs from 'fs'
import { ParserError, ParserWarning, SkipMetadataFile, printWarning } from 'parser'
import { parseFile } from 'parser/file'
import { extractBaseName, getMetadata } from 'parser/metadata'
import { isDirectoryMetadata } from 'parser/metadata.guard'

import type { DirectoryDTO, FilesystemNodeChildDTO } from 'unix-js-lib'

export async function parseDirectory(directoryPath: string): Promise<DirectoryDTO> {
    const metadata = getMetadata(`${directoryPath}/`, isDirectoryMetadata) ?? {}
    return {
        type: 'directory',
        internalName: extractBaseName(directoryPath),
        displayName: metadata.displayName,
        accessType: metadata.accessType,
        children: await parseChildren(directoryPath) // eslint-disable-line @typescript-eslint/no-use-before-define
    }
}

async function parseChildren(directoryPath: string): Promise<FilesystemNodeChildDTO[]> {
    const directory = fs.readdirSync(directoryPath).map(name => `${directoryPath}/${name}`)
    const childDirectoryNames = directory.filter(name => fs.statSync(name).isDirectory())
    const results: FilesystemNodeChildDTO[] = []
    await Promise.all(directory.map(async(name) => {
        try {
            if (childDirectoryNames.includes(name)) {
                results.push(await parseDirectory(name))
            } else {
                results.push(await parseFile(name))
            }
        } catch (e) {
            if (e instanceof SkipMetadataFile) {
                // Skip silently 
            } else if (e instanceof ParserWarning) {
                printWarning(e.message)
            } else if (e instanceof ParserError) {
                console.error(e.message)
            } else {
                console.error(`Failed to parse '${name}':`)
                console.error(e)
            }
        }
    }))
    return results
}
