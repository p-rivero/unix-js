function replacePrefix(str: string, prefix: string, newPrefix: string): string {
    return str.startsWith(prefix) ? newPrefix + str.slice(prefix.length) : str
}

function replaceSuffix(str: string, suffix: string, newSuffix: string): string {
    return str.endsWith(suffix) ? str.slice(0, -suffix.length) + newSuffix : str
}

function normalizeAnonymousFunction(code: string): string {
    let replaced = replacePrefix(code, 'function anonymous(process,require=()=>{}\n) {\n', '(process)=>{')
    replaced = replacePrefix(replaced, 'function anonymous(require=()=>{}\n) {\n', '()=>{')
    return replaceSuffix(replaced, '\n}', '}')
}

export function serializeObject(obj: unknown, indent: number): string {
    const serializedFunctions: string[] = []
    function replaceFunctionsWithPlaceholders(key: string, val: unknown): unknown {
        if (typeof val === 'function') {
            const code = normalizeAnonymousFunction(val.toString())
            serializedFunctions.push(code)
            return `{func_${serializedFunctions.length - 1}}`
        }
        return val
    }
    const json = JSON.stringify(obj, replaceFunctionsWithPlaceholders, indent)
    return json.replace(/"\{func_(?<id>\d+)\}"/gu, (match, id) => serializedFunctions[Number(id)])
}
