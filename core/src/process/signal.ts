export class Signal {
    public readonly name: string
    public readonly number: number

    public constructor(name: string, number: number) {
        this.name = name
        this.number = number
    }

    public toString(): string {
        return this.name
    }

    public get exitCode(): number {
        return this.number + 128
    }
}

export const SIGINT = new Signal('SIGINT', 2)
