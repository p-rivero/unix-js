/*
 * Generated type guards for "eval-module.ts".
 * WARNING: Do not manually change this file.
 */
import { BinaryFileMethods, DeviceFileMethods } from "./eval-module";

export function isBinaryFileMethods(obj: unknown): obj is BinaryFileMethods {
    const typedObj = obj as BinaryFileMethods
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        typeof typedObj["execute"] === "function"
    )
}

export function isDeviceFileMethods(obj: unknown): obj is DeviceFileMethods {
    const typedObj = obj as DeviceFileMethods
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["read"] === "undefined" ||
            typeof typedObj["read"] === "function") &&
        (typeof typedObj["write"] === "undefined" ||
            typeof typedObj["write"] === "function")
    )
}
