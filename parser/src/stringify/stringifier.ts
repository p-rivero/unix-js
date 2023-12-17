
export abstract class Stringifier {
    private readonly indentIncrement: number
    private currentIndent: number
    private result: string

    protected constructor(indent: number) {
        this.indentIncrement = indent
        this.currentIndent = 0
        this.result = ''
    }

    protected reset(): void {
        this.currentIndent = 0
        this.result = ''
    }

    protected append(text: string): void {
        this.result += text
    }

    protected newLineSameIndent(): void {
        this.append('\n')
        this.append(' '.repeat(this.currentIndent))
    }

    protected newLineIncrementIndent(): void {
        this.currentIndent += this.indentIncrement
        this.newLineSameIndent()
    }

    protected newLineDecrementIndent(): void {
        this.currentIndent -= this.indentIncrement
        this.newLineSameIndent()
    }

    public getResult(): string {
        this.addNewLineIfNecessary()
        return this.result
    }

    private addNewLineIfNecessary(): void {
        if (!this.result.endsWith('\n')) {
            this.append('\n')
        }
    }
}
