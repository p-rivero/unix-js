import fs from 'fs'
import { printWarning } from 'parser'
import type { AccessType, FilePermission } from 'unix-core'

export const METADATA_EXTENSION = '.meta.json'

export interface UnixJSMetadata {
    readonly displayName?: string
    readonly accessType?: AccessType
    readonly ignore?: boolean
    readonly includeIfDefined?: string
}

export interface GlobalSettingsMetadata {
    readonly echoCtrlC?: boolean
}

/** @see {isFileMetadata} ts-auto-guard:type-guard */
export interface FileMetadata extends UnixJSMetadata {
    readonly fileType?: 'text' | 'binary' | 'device'
    readonly permissions?: FilePermission
    readonly isStartupCommand?: boolean
    readonly isStdin?: boolean
    readonly isStdout?: boolean
    readonly isStderr?: boolean
}

/** @see {isDirectoryMetadata} ts-auto-guard:type-guard */
export interface DirectoryMetadata extends UnixJSMetadata {
    readonly isCommandPath?: boolean
    readonly isHomeDir?: boolean
    readonly globalSettings?: GlobalSettingsMetadata
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

export function shouldSkipFile(metadata: UnixJSMetadata): boolean {
    if (metadata.ignore === true) {
        return true
    }
    if (metadata.includeIfDefined !== undefined) {
        return process.env[metadata.includeIfDefined] === undefined
    }
    return false
}
