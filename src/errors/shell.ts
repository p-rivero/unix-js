import { InvalidArgument, type FakeTermError } from '@/errors'

export class ShellCommandFailure extends InvalidArgument {
    public constructor(command: string, exception: FakeTermError) {
        super(`${command}: ${exception.linuxDescription}`)
        this.name = 'ShellCommandFailure'
    }
}
