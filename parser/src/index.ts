import { OUT_FILE_STDOUT, parseCliArgs } from 'cli-arguments'
import fs from 'fs'
import { parseDirectory } from 'parser/directory'

const options = parseCliArgs()
const result = parseDirectory(options.inputDir)
const resultString = `export default ${JSON.stringify(result, null, options.indent)}`

if (options.outFile === OUT_FILE_STDOUT) {
    console.log(resultString)
} else {
    fs.writeFileSync(options.outFile, resultString)
}
