import { ParserError, printWarning } from 'parser'
import { parseDirectory } from 'parser/directory'
import { getMetadata, type GlobalSettingsMetadata } from 'parser/metadata'
import { isDirectoryMetadata } from 'parser/metadata.guard'

import type { DirectoryDTO } from 'unix-core'

export async function parseRootDirectory(directoryPath: string): Promise<[DirectoryDTO, GlobalSettingsMetadata]> {
    const metadata = getMetadata(`${directoryPath}/`, isDirectoryMetadata) ?? {}
    if (metadata.ignore === true) {
        throw new ParserError('Root directory cannot be ignored.')
    }
    if (metadata.displayName !== undefined) {
        printWarning(`Root directory (${directoryPath}) has a display name (${metadata.displayName}), which will be ignored.`)
    }

    const result = await parseDirectory(null, directoryPath)
    const settings = metadata.globalSettings ?? {}
    return [result, settings]
}
