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
        (typeof typedObj["includeIfDefined"] === "undefined" ||
            typeof typedObj["includeIfDefined"] === "string") &&
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
        (typeof typedObj["includeIfDefined"] === "undefined" ||
            typeof typedObj["includeIfDefined"] === "string") &&
        (typeof typedObj["isCommandPath"] === "undefined" ||
            typedObj["isCommandPath"] === false ||
            typedObj["isCommandPath"] === true) &&
        (typeof typedObj["isHomeDir"] === "undefined" ||
            typedObj["isHomeDir"] === false ||
            typedObj["isHomeDir"] === true) &&
        (typeof typedObj["globalSettings"] === "undefined" ||
            (typedObj["globalSettings"] !== null &&
                typeof typedObj["globalSettings"] === "object" ||
                typeof typedObj["globalSettings"] === "function") &&
            (typeof typedObj["globalSettings"]["echoCtrlC"] === "undefined" ||
                typedObj["globalSettings"]["echoCtrlC"] === false ||
                typedObj["globalSettings"]["echoCtrlC"] === true))
    )
}
