import { OUT_FILE_STDOUT, parseCliArgs } from 'cli-arguments'
import fs from 'fs'
import { parseDirectory } from 'parser/directory'
import { serializeObject } from 'serialize-object'

const options = parseCliArgs()
const result = await parseDirectory(null, options.inputDir)
const resultString = `export default ${serializeObject(result, options.indent)}`

if (options.outFile === OUT_FILE_STDOUT) {
    console.log(resultString)
} else {
    fs.writeFileSync(options.outFile, resultString)
}
