export function trim(text: string, trimmedChar: string): string {
    let escapedChar = trimmedChar
    if (trimmedChar === ']') {
        escapedChar = '\\]' 
    }
    if (trimmedChar === '^') {
        escapedChar = '\\^' 
    }
    if (trimmedChar === '\\') {
        escapedChar = '\\\\' 
    }
    return text.replace(new RegExp(`^[${escapedChar}]+|[${escapedChar}]+$`, 'gu'), '')
}
