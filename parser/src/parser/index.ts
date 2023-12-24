import colors from 'colors/safe'

export class ParserWarning extends Error {}
export class ParserError extends Error {}
export class SkipMetadataFile extends Error {}

export function printWarning(message: string): void {
    console.warn(colors.yellow(message))
}
