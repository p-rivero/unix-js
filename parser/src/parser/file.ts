
import fs from 'fs'
import { SkipFile, printWarning } from 'parser'
import { parseBinaryFile, parseDeviceFile } from 'parser/executable-file'
import { FileInfo } from 'parser/file-info'
import { METADATA_EXTENSION, getMetadata, shouldSkipFile } from 'parser/metadata'
import { isFileMetadata } from 'parser/metadata.guard'

import type { FilePermission, FilesystemNodeChildDTO } from 'unix-core'

function filterBinaryFilePermissions(permissions: FilePermission | undefined, filePath: string): 'read-only' | 'execute' | undefined {
    if (permissions === 'read-write') {
        printWarning(`Device file '${filePath}' cannot have 'read-write' permissions, changing to read-only.`)
        return 'read-only'
    }
    return permissions
}

function filterDeviceFilePermissions(permissions: FilePermission | undefined, filePath: string): 'read-only' | 'read-write' | undefined {
    if (permissions === 'execute') {
        printWarning(`Device file '${filePath}' cannot have 'execute' permissions, changing to read-write.`)
        return 'read-write'
    }
    return permissions
}

export async function parseFile(parent: FileInfo, filePath: string): Promise<FilesystemNodeChildDTO> {
    if (filePath.endsWith(METADATA_EXTENSION)) {
        throw new SkipFile()
    }
    const metadata = getMetadata(filePath, isFileMetadata) ?? {}
    if (shouldSkipFile(metadata)) {
        throw new SkipFile()
    }

    const file = new FileInfo(parent, filePath, metadata.displayName)
    file.setFlagIfTrue('isStartupCommand', metadata.isStartupCommand)
    file.setFlagIfTrue('isStdin', metadata.isStdin)
    file.setFlagIfTrue('isStdout', metadata.isStdout)
    file.setFlagIfTrue('isStderr', metadata.isStderr)

    const commonAttributes = {
        name: file.name,
        permissions: metadata.permissions,
        accessType: metadata.accessType
    }
    switch (metadata.fileType) {
        case 'binary': {
            return {
                ...commonAttributes,
                type: 'binary-file',
                permissions: filterBinaryFilePermissions(metadata.permissions, filePath),
                generator: await parseBinaryFile(file)
            }
        }
        case 'device': {
            return {
                ...commonAttributes,
                type: 'device-file',
                permissions: filterDeviceFilePermissions(metadata.permissions, filePath),
                generator: await parseDeviceFile(file)
            }
        }
        default: {
            const fileContents = fs.readFileSync(filePath, 'utf-8')
            return {
                ...commonAttributes,
                type: 'text-file',
                content: fileContents
            }
        }
    }
}



