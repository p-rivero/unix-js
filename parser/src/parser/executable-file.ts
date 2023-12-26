import fs from 'fs'
import { ParserError, ParserWarning } from 'parser'
import { isBinaryFileMethods, isDeviceFileMethods } from 'parser/executable-file.guard'
import type { FileInfo } from 'parser/file-info'
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

interface TerserSyntaxError extends Error {
    message: string
    line: number
}

const HEADER_LINES = 7

async function wrapAndMinify(file: FileInfo): Promise<unknown> {
    const wrapperCode = `
        const m = {
            id: "${file.internalPath}",
            filename: "${file.displayPath}",
            exports: {},
        };
        ((module, exports) => {
            ${fs.readFileSync(file.realPath, 'utf-8')}
        })(m, m.exports);
        return m.exports;
    `
    // eslint-disable-next-line @typescript-eslint/naming-convention, camelcase -- terser uses snake_case
    const { code } = await minify(wrapperCode, { parse: { bare_returns: true } })
    if (code === undefined) {
        throw new ParserError(`Error minifying code for ${file.toString()}`)
    }
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func -- cannot be avoided
    return new Function(code)
}

async function parseExecutableFile<T>(file: FileInfo, validator: (fn: unknown) => fn is T): Promise<() => T> {
    function isGeneratorFunction(fn: unknown): fn is () => T {
        if (typeof fn !== 'function') {
            return false
        }
        const result = fn() as unknown
        return validator(result)
    }
    try {
        const fn = await wrapAndMinify(file)
        if (isGeneratorFunction(fn)) {
            return fn
        }
    } catch (error) {
        if (error instanceof ParserError) {
            throw error
        }
        if (error instanceof Error && error.name === 'SyntaxError') {
            const { message, line } = error as TerserSyntaxError
            throw new ParserError(`Syntax error in ${file.toString()}, line ${line - HEADER_LINES}:\n\t${message}`)
        }
        console.error(error)
        throw new ParserWarning(`Error evaluating code for ${file.toString()}`)
    }
    throw new ParserWarning(`Invalid executable: ${file.toString()}, make sure it exports the required functions. Ignoring file.`)
}

export async function parseDeviceFile(file: FileInfo): Promise<() => DeviceFileMethods> {
    return parseExecutableFile(file, isDeviceFileMethods)
}

export async function parseBinaryFile(file: FileInfo): Promise<() => BinaryFileMethods> {
    return parseExecutableFile(file, isBinaryFileMethods)
}
