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
        (typeof typedObj["ignore"] === "undefined" ||
            typedObj["ignore"] === false ||
            typedObj["ignore"] === true) &&
        (typeof typedObj["fileType"] === "undefined" ||
            typedObj["fileType"] === "text" ||
            typedObj["fileType"] === "binary" ||
            typedObj["fileType"] === "device") &&
        (typeof typedObj["isStartupCommand"] === "undefined" ||
            typedObj["isStartupCommand"] === false ||
            typedObj["isStartupCommand"] === true) &&
        (typeof typedObj["isStdin"] === "undefined" ||
            typedObj["isStdin"] === false ||
            typedObj["isStdin"] === true) &&
        (typeof typedObj["isStdout"] === "undefined" ||
            typedObj["isStdout"] === false ||
            typedObj["isStdout"] === true) &&
        (typeof typedObj["isStderr"] === "undefined" ||
            typedObj["isStderr"] === false ||
            typedObj["isStderr"] === true)
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
        (typeof typedObj["ignore"] === "undefined" ||
            typedObj["ignore"] === false ||
            typedObj["ignore"] === true) &&
        (typeof typedObj["isCommandDir"] === "undefined" ||
            typedObj["isCommandDir"] === false ||
            typedObj["isCommandDir"] === true) &&
        (typeof typedObj["isHomeDir"] === "undefined" ||
            typedObj["isHomeDir"] === false ||
            typedObj["isHomeDir"] === true)
    )
}
