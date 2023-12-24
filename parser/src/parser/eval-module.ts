import { ParserError, ParserWarning } from 'parser'
import { isBinaryFileMethods, isDeviceFileMethods } from 'parser/eval-module.guard'
import { minify } from 'terser'

/** @see {isBinaryFileMethods} ts-auto-guard:type-guard */
export interface BinaryFileMethods {
    execute: () => number | undefined
}

/** @see {isDeviceFileMethods} ts-auto-guard:type-guard */
export interface DeviceFileMethods {
    read?: () => string
    write?: () => void
}

async function wrapModule(internalPath: string, externalPath: string, source: string): Promise<unknown> {
    const wrapper = `() => {
        const module = {
            id: "${internalPath}",
            filename: "${externalPath}",
            exports: {},
        };
        ((module, exports) => {
            ${source}
        })(module, module.exports);
        return module.exports;
    }`
    const { code } = await minify(wrapper)
    if (code === undefined) {
        throw new ParserError(`Error minifying code for file ${internalPath}`)
    }
    return new Function(code)
}

async function evaluateModule<T>(internalPath: string, externalPath: string, source: string, validator: (fn: unknown) => fn is T): Promise<() => T> {
    function isGeneratorFunction(fn: unknown): fn is () => T {
        if (typeof fn !== 'function') {
            return false
        }
        const result = fn() as unknown
        return validator(result)
    }
    try {
        const fn = await wrapModule(internalPath, externalPath, source)
        if (isGeneratorFunction(fn)) {
            return fn
        }
    } catch (error) {
        if (error instanceof ParserError) {
            throw error
        }
        if (error instanceof Error && error.name === 'SyntaxError') {
            const { message, line } = error
            throw new ParserError(`Syntax error in file ${'TODO'} [${internalPath}], line ${line - 7}:\n    ${message}`)
        }
        console.error(error)
        throw new ParserWarning(`Error evaluating code for file ${internalPath}`)
    }
    throw new ParserWarning(`Invalid executable: ${internalPath}, make sure it exports the required functions. Ignoring file.`)
}

export async function evaluateDeviceFileModule(internalPath: string, externalPath: string, source: string): Promise<() => DeviceFileMethods> {
    return evaluateModule(internalPath, externalPath, source, isDeviceFileMethods)
}

export async function evaluateBinaryFileModule(internalPath: string, externalPath: string, source: string): Promise<() => BinaryFileMethods> {
    return evaluateModule(internalPath, externalPath, source, isBinaryFileMethods)
}
