import { InvalidArgument, type UnixJsError } from 'errors'

export class ShellCommandFailure extends InvalidArgument {
    public constructor(command: string, exception: UnixJsError) {
        super(`${command}: ${exception.linuxDescription}`)
        this.name = "ShellCommandFailure"
        this.cause = exception
    }
}
