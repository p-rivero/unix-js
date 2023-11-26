export abstract class FakeTermError extends Error { }

export class InternalError extends FakeTermError {
    public constructor(message: string) {
        super(message)
        this.name = 'InternalError'
    }
}

export class IncorrectDeclaration extends FakeTermError {
    public constructor(message: string) {
        super(`Incorrect parameter in FakeTerm initializer: ${message}`)
        this.name = 'IncorrectDeclaration'
    }
}
