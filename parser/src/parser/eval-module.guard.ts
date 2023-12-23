/*
 * Generated type guards for "eval-module.ts".
 * WARNING: Do not manually change this file.
 */
import { DeviceFileFunctions, BinaryFileFunctions } from "./eval-module";

export function isDeviceFileFunctions(obj: unknown): obj is DeviceFileFunctions {
    const typedObj = obj as DeviceFileFunctions
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        typeof typedObj["read"] === "function" &&
        typeof typedObj["write"] === "function"
    )
}

export function isBinaryFileFunctions(obj: unknown): obj is BinaryFileFunctions {
    const typedObj = obj as BinaryFileFunctions
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        typeof typedObj["execute"] === "function"
    )
}
