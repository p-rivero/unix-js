import fs from 'fs'
import type { AccessType, FilePermission } from 'unix-js-lib'

const METADATA_EXTENSION = '.unixjs.json'

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
}

export function getMetadata<T>(filePath: string, validator: (obj: unknown) => obj is T): T | null {
    const metadataPath = filePath + METADATA_EXTENSION
    if (!fs.existsSync(metadataPath)) {
        return null
    }
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const json = JSON.parse(fileContent) as unknown
    if (validator(json)) {
        return json
    }
    console.warn(`Invalid metadata file: ${metadataPath}, using defaults.`)
    return null
}

export function extractBaseName(filePath: string): string {
    const parts = filePath.split('/')
    return parts[parts.length - 1]
}
