import fs from 'fs'
import { printWarning } from 'parser'
import type { AccessType, FilePermission } from 'unix-js-lib'

export const METADATA_EXTENSION = '.meta.json'

export interface UnixJSMetadata {
    readonly displayName?: string
    readonly accessType?: AccessType
}

/** @see {isFileMetadata} ts-auto-guard:type-guard */
export interface FileMetadata extends UnixJSMetadata {
    readonly fileType?: 'text' | 'binary' | 'device'
    readonly permissions?: FilePermission
}

/** @see {isDirectoryMetadata} ts-auto-guard:type-guard */
export interface DirectoryMetadata extends UnixJSMetadata {
    readonly isCommandDir?: boolean
    readonly isHomeDir?: boolean
}

export function getMetadata<T>(filePath: string, validator: (obj: unknown) => obj is T): T | null {
    const metadataPath = filePath + METADATA_EXTENSION
    if (!fs.existsSync(metadataPath)) {
        return null
    }
    const fileContent = fs.readFileSync(metadataPath, 'utf-8')
    try {
        const json = JSON.parse(fileContent) as unknown
        if (validator(json)) {
            return json
        }
        throw new Error('JSON object does not match expected schema.')
    } catch (e) {
        if (!(e instanceof Error)) {
            throw e
        }
        printWarning(`Ignoring metadata file "${metadataPath}" due to error: ${e.message}`)
        return null
    }
}

