import { parseCliArgs } from 'cli-arguments'
import fs from 'fs'
import { parseUnixJsDirectory } from 'parser'
import { DirectoryStringifier } from 'stringify/stringify-directory'

const options = parseCliArgs()
const result = parseUnixJsDirectory(options.inputDir)
const resultString = new DirectoryStringifier(options.indent).stringify(result)

if (options.outFile === null) {
    console.log(resultString)
} else {
    fs.writeFileSync(options.outFile, resultString)
}
