import colors from 'colors/safe.js'

export class ParserWarning extends Error {}
export class ParserError extends Error {}
export class SkipFile extends Error {}

export function printWarning(message: string): void {
    console.warn(colors.yellow(message))
}
