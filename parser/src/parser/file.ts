
import fs from 'fs'
import { SkipMetadataFile, printWarning } from 'parser'
import { evaluateBinaryFileModule, evaluateDeviceFileModule } from 'parser/eval-module'
import { METADATA_EXTENSION, extractBaseName, getMetadata } from 'parser/metadata'
import { isFileMetadata } from 'parser/metadata.guard'

import type { FilePermission, FilesystemNodeChildDTO } from 'unix-js-lib'

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

export async function parseFile(filePath: string): Promise<FilesystemNodeChildDTO> {
    if (filePath.endsWith(METADATA_EXTENSION)) {
        throw new SkipMetadataFile()
    }
    console.warn(`Parsing file '${filePath}'...`)
    const fileContents = fs.readFileSync(filePath, 'utf-8')
    const metadata = getMetadata(filePath, isFileMetadata) ?? {}

    const commonAttributes = {
        internalName: extractBaseName(filePath),
        displayName: metadata.displayName,
        permissions: metadata.permissions,
        accessType: metadata.accessType
    }

    switch (metadata.fileType) {
        case 'binary': {
            return {
                ...commonAttributes,
                type: 'binary-file',
                permissions: filterBinaryFilePermissions(metadata.permissions, filePath),
                generator: await evaluateBinaryFileModule('TODO', 'TODO', fileContents)
            }
        }
        case 'device': {
            return {
                ...commonAttributes,
                type: 'device-file',
                permissions: filterDeviceFilePermissions(metadata.permissions, filePath),
                generator: await evaluateDeviceFileModule('TODO', 'TODO', fileContents)
            }
        }
        default:
            return {
                ...commonAttributes,
                type: 'text-file',
                content: fileContents
            }
    }
}



