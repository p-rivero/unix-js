import fs from 'fs'
import { ParserError, ParserWarning } from 'parser'
import { isBinaryFileMethods, isDeviceFileMethods } from 'parser/executable-file.guard'
import type { FileInfo } from 'parser/file-info'
import { minify } from 'terser'
import ts from 'typescript'

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

function removeBoilerplate(code: string): string {
    return code
        .replace('Object.defineProperty(exports, "__esModule", { value: true });', '')
        .replace(/(?:exports\.\w* = )+void 0;/gu, '')
}

function wrapSourceCode(file: FileInfo): string {
    const jsCode = ts.transpile(fs.readFileSync(file.realPath, 'utf-8'), {
        allowJs: true,
        checkJs: true,
        noImplicitUseStrict: true,
        skipLibCheck: true,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ESNext
    })
    return `
        const id = "${file.displayPath}";
        const m = {
            id,
            filename: id,
            exports: {},
        };
        ((module, exports) => {
            ${removeBoilerplate(jsCode)}
        })(m, m.exports);
        return m.exports;
    `
}

async function minifyAndCheck(source: string): Promise<unknown> {
    // eslint-disable-next-line @typescript-eslint/naming-convention, camelcase -- terser uses snake_case
    const { code: minifiedCode } = await minify(source, { parse: { bare_returns: true } })
    if (minifiedCode === undefined) {
        throw new ParserError('Error minifying code')
    }
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func -- cannot be avoided
    return new Function('require=()=>{}', minifiedCode)
}

function getCodeLine(code: string, line: number): string {
    const lineSrc = code.split('\n')[line - 1].trim()
    return `\t${lineSrc}\n\t${'^'.repeat(lineSrc.length)}`
}

async function parseExecutableFile<T>(file: FileInfo, validator: (fn: unknown) => fn is T, validatorFailMsg: string): Promise<() => T> {
    function isGeneratorFunction(fn: unknown): fn is () => T {
        if (typeof fn !== 'function') {
            return false
        }
        const result = fn() as unknown
        return validator(result)
    }
    const sourceCode: string = wrapSourceCode(file)
    try {
        const fn = await minifyAndCheck(sourceCode)
        if (isGeneratorFunction(fn)) {
            return fn
        }
    } catch (error) {
        if (error instanceof ParserError) {
            throw error
        }
        if (error instanceof Error && error.name === 'SyntaxError') {
            const { message, line } = error as TerserSyntaxError
            throw new ParserError(`Syntax error in ${file.toString()}:\n${getCodeLine(sourceCode, line)}\n\t${message}`)
        }
        console.error(error)
        throw new ParserWarning(`Error evaluating code for ${file.toString()}`)
    }
    throw new ParserWarning(validatorFailMsg)
}

export async function parseDeviceFile(file: FileInfo): Promise<() => DeviceFileMethods> {
    const validatorFailMsg = `Invalid device file: ${file.toString()}, make sure it exports the required functions "read" and "write". Ignoring file.`
    return parseExecutableFile(file, isDeviceFileMethods, validatorFailMsg)
}

export async function parseBinaryFile(file: FileInfo): Promise<() => BinaryFileMethods> {
    const validatorFailMsg = `Invalid binary file: ${file.toString()}, make sure it exports the required function "execute". Ignoring file.`
    return parseExecutableFile(file, isBinaryFileMethods, validatorFailMsg)
}
