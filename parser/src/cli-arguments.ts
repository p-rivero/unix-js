import { parse } from 'ts-command-line-args'

export interface CliArguments {
    readonly inputDir: string
    readonly outFile: string
    readonly templateFile: string
    readonly indent: number
    readonly help: boolean
}

export const OUT_FILE_STDOUT = '__stdout__'
export const TEMPLATE_FILE_DEFAULT = '__default_template__'

export function parseCliArgs(): CliArguments {
    try {
        return parse({
            inputDir: {
                type: String,
                alias: 'i',
                description: 'Path to the directory to parse. Defaults to the CWD.',
                defaultOption: true,
                defaultValue: '.'
            },
            outFile: {
                type: String,
                alias: 'o',
                description: 'The output file where the results will be written. Defaults to stdout.',
                defaultValue: OUT_FILE_STDOUT
            },
            templateFile: {
                type: String,
                alias: 't',
                description: 'Path of the template file to use. The template is a JS/TS file with the text "[RESULT]" as a placeholder. Defaults to a basic template.',
                defaultValue: TEMPLATE_FILE_DEFAULT
            },
            indent: {
                type: Number,
                description: 'The number of spaces used to indent the output file. Use 0 to minify the output. Defaults to 4.',
                defaultValue: 4
            },
            help: {
                type: Boolean,
                alias: 'h',
                description: 'Prints this usage guide'
            }
        }, {
            helpArg: 'help',
            headerContentSections: [{ header: 'unix.js parser', content: 'Converts a directory of your choice into a virtual filesystem.' }]
        })
    } catch (e) {
        if (e instanceof Error) {
            console.error(e.message)
        } else {
            console.error(e)
        }
        return process.exit(1)
    }
}
