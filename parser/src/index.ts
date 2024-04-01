import { OUT_FILE_STDOUT, parseCliArgs } from 'cli-arguments'
import fs from 'fs'
import { parseProject } from 'parser/project'
import { serializeWithFormat } from 'serialize/serialize-with-format'

function writeFile(path: string, content: string): void {
    const outDir = path.split('/').slice(0, -1).join('/')
    fs.mkdirSync(outDir, { recursive: true })
    fs.writeFileSync(path, content)
}

const options = parseCliArgs()
try {
    const result = await parseProject(options.inputDir)
    const resultString = serializeWithFormat(result, options.outFormat, options.indent)
    
    if (options.outFile === OUT_FILE_STDOUT) {
        console.log(resultString)
    } else {
        writeFile(options.outFile, resultString)
    }
} catch (error) {
    if (error instanceof Error) {
        console.error(`Failed to parse ${options.inputDir}: ${error.message}`)
    } else {
        console.error(error)
    }
    process.exit(1)
}
