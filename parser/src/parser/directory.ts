import fs from 'fs'
import { parseFile } from 'parser/file'
import { extractBaseName, getMetadata } from 'parser/metadata'
import { isDirectoryMetadata } from 'parser/metadata.guard'

import type { DirectoryDTO } from 'unix-js-lib'

export async function parseDirectory(directoryPath: string): Promise<DirectoryDTO> {
    const directory = fs.readdirSync(directoryPath).map(name => `${directoryPath}/${name}`)
    const childDirectoryNames = directory.filter(name => fs.statSync(name).isDirectory())
    const children = await Promise.all(directory.map(
        async name => childDirectoryNames.includes(name) ? parseDirectory(name) : parseFile(name)
    ))
    const metadata = getMetadata(`${directoryPath}/`, isDirectoryMetadata) ?? {}

    return {
        type: 'directory',
        children,
        'internalName': extractBaseName(directoryPath),
        'displayName': metadata.displayName,
        'accessType': metadata.accessType
    }
}
