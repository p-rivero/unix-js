import { FakeTermError } from '@/errors/internal'

export class DirectoryNotExecutable extends FakeTermError {
    public constructor(directoryPath: string) {
        super(`User attempted to execute directory '${directoryPath}'. Only files can be executed.`)
        this.name = 'DirectoryNotExecutable'
    }
}
