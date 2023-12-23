/*
 * Generated type guards for "metadata.ts".
 * WARNING: Do not manually change this file.
 */
import { FileMetadata, DirectoryMetadata } from "./metadata";

export function isFileMetadata(obj: unknown): obj is FileMetadata {
    const typedObj = obj as FileMetadata
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["displayName"] === "undefined" ||
            typeof typedObj["displayName"] === "string") &&
        (typeof typedObj["fileType"] === "undefined" ||
            typedObj["fileType"] === "text" ||
            typedObj["fileType"] === "binary" ||
            typedObj["fileType"] === "device")
    )
}

export function isDirectoryMetadata(obj: unknown): obj is DirectoryMetadata {
    const typedObj = obj as DirectoryMetadata
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["displayName"] === "undefined" ||
            typeof typedObj["displayName"] === "string") &&
        (typeof typedObj["isCommandDir"] === "undefined" ||
            typedObj["isCommandDir"] === false ||
            typedObj["isCommandDir"] === true)
    )
}
