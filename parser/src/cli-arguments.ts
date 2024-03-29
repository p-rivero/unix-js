import { parse } from 'ts-command-line-args'

export interface CliArguments {
    readonly inputDir: string
    readonly outFile: string
    readonly template: string
    readonly indent: number
    readonly help: boolean
}

export const OUT_FILE_STDOUT = '__stdout__'

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
            template: {
                type: String,
                alias: 't',
                description: 'Template file to use for outputting the result. Can be one of the following: CommonJS, Module, <custom template path>\n'
                    + 'The custom template is a .js/.ts file that contains the text "[RESULT]" as a placeholder. Defaults to CommonJS.',
                defaultValue: 'CommonJs'
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
