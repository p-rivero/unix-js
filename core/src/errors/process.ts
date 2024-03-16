import { UnixJsError } from 'errors'

export class ProgramExit {
    public readonly exitCode: number

    public constructor(exitCode: number) {
        this.exitCode = exitCode
    }
}

export class NoSuchProcess extends UnixJsError {
    public constructor() {
        super('Could not find a process with this PID.', 3, 'ESRCH', 'No such process')
        this.name = 'NoSuchProcess'
    }
}
