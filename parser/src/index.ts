import { OUT_FILE_STDOUT, TEMPLATE_FILE_DEFAULT, parseCliArgs } from 'cli-arguments'
import fs from 'fs'
import { parseDirectory } from 'parser/directory'
import { serializeWithTemplate } from 'serialize/serialize-with-template'

const options = parseCliArgs()
try {
    const result = await parseDirectory(null, options.inputDir)
    const template = options.templateFile === TEMPLATE_FILE_DEFAULT ? null : options.templateFile
    const resultString = serializeWithTemplate(result, template, options.indent)
    
    if (options.outFile === OUT_FILE_STDOUT) {
        console.log(resultString)
    } else {
        fs.writeFileSync(options.outFile, resultString)
    }
} catch (error) {
    if (error instanceof Error) {
        console.error(`Failed to parse ${options.inputDir}: ${error.message}`)
    } else {
        console.error(error)
    }
    process.exit(1)
}
