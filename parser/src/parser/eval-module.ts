import { ParserWarning } from 'parser'
import { isBinaryFileFunctions, isDeviceFileFunctions } from 'parser/eval-module.guard'
import path from 'path'

/** @see {isDeviceFileFunctions} ts-auto-guard:type-guard */
export interface DeviceFileFunctions {
    read: () => string
    write: (content: string) => void
}

/** @see {isBinaryFileFunctions} ts-auto-guard:type-guard */
export interface BinaryFileFunctions {
    execute: (context: object, args: string[]) => number | undefined
}


export async function evaluateDeviceFileModule(relativePath: string): Promise<DeviceFileFunctions> {
    try {
        const absolutePath = path.resolve(relativePath)
        const mod = await import(absolutePath) as unknown
        if (isDeviceFileFunctions(mod)) {
            return mod
        }
    } catch (error) {
        console.error(error)
        throw new ParserWarning(`Error evaluating code for device file ${relativePath}`)
    }
    throw new ParserWarning(`Invalid device file: ${relativePath}, make sure it exports the required functions 'read' and 'write'. Ignoring file.`)
}

export async function evaluateBinaryFileModule(relativePath: string): Promise<BinaryFileFunctions> {
    try {
        const absolutePath = path.resolve(relativePath)
        const mod = await import(absolutePath) as unknown
        if (isBinaryFileFunctions(mod)) {
            return mod
        }
    } catch (error) {
        console.error(error)
        throw new ParserWarning(`Error evaluating code for binary file ${relativePath}`)
    }
    throw new ParserWarning(`Invalid binary file: ${relativePath}, make sure it exports the required function 'execute'. Ignoring file.`)
}
