import { serializeObject } from 'serialize/serialize-object'

function convertCJStoESM(cjsCode: string): string {
    const importNames = new Map<string, string>()
    let importCounter = 1
    const requireRegex = /require\((?<quote>['"])(?<moduleName>.*?)\k<quote>\)/gu
    const esmCode = cjsCode.replace(requireRegex, (_substring, _quote, moduleName: string) => {
        if (!importNames.has(moduleName)) {
            const uniqueImportName = `__${importCounter++}`
            importNames.set(moduleName, uniqueImportName)
        }
        return importNames.get(moduleName) ?? ''
    })

    const importStatements = Array.from(importNames.entries())
        .map(([moduleName, importName]) => `import * as ${importName} from '${moduleName}'`)
        .join('\n')
    const result = `${importStatements}\n${esmCode}`
    return result.replace('module.exports=', 'export default ')
}


export function serializeWithFormat(obj: unknown, format: string, indent: number): string {
    switch (format.toLowerCase()) {
        case 'cjs':
        case 'commonjs':
            return `module.exports=${serializeObject(obj, indent)}`
        case 'module':
        case 'esm': {
            const cjs = serializeWithFormat(obj, 'commonjs', indent)
            try {
                return convertCJStoESM(cjs)
            } catch (e) {
                console.error(e)
                throw e
            }
        }
        default:
            throw new Error(`Unknown format "${format}"`)
    }
}
