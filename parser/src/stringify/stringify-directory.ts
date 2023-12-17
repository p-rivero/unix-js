import { Stringifier } from 'stringify/stringifier'
import type { DirectoryDTO } from 'unix-js-lib'

export class DirectoryStringifier extends Stringifier {

    public constructor(indent: number) {
        super(indent)
    }

    public stringify(directory: DirectoryDTO): string {
        this.reset()
        this.append('export default {')
        this.newLineIncrementIndent()
        // TODO
        this.newLineDecrementIndent()
        this.append('}')
        return this.getResult()
    }

}
