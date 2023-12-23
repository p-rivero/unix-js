import { isBinaryFileFunctions, isDeviceFileFunctions } from 'parser/eval-module.guard'

/** @see {isDeviceFileFunctions} ts-auto-guard:type-guard */
export interface DeviceFileFunctions {
    read: () => string
    write: (content: string) => void
}

/** @see {isBinaryFileFunctions} ts-auto-guard:type-guard */
export interface BinaryFileFunctions {
    execute: (context: object, args: string[]) => number | undefined
}


export async function evaluateDeviceFileModule(path: string): Promise<DeviceFileFunctions> {
    try {
        const mod = await import(path) as unknown
        if (isDeviceFileFunctions(mod)) {
            return mod
        }
        throw Error(`Invalid device file: ${path}, make sure it exports the required functions 'read' and 'write'. Ignoring file.`)
    } catch (error) {
        console.error(error)
        throw Error(`Error evaluating code for device file ${path}`)
    }
}

export async function evaluateBinaryFileModule(path: string): Promise<BinaryFileFunctions> {
    try {
        const mod = await import(path) as unknown
        if (isBinaryFileFunctions(mod)) {
            return mod
        }
        throw Error(`Invalid binary file: ${path}, make sure it exports the required function 'execute'. Ignoring file.`)
    } catch (error) {
        console.error(error)
        throw Error(`Error evaluating code for binary file ${path}`)
    }
}
