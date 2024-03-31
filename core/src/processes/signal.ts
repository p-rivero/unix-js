/* eslint-disable @typescript-eslint/naming-convention */

export class Signal {
    public readonly name: string
    public readonly number: number
    public readonly terminateByDefault: boolean

    private constructor(name: string, number: number, terminateByDefault: boolean) {
        this.name = name
        this.number = number
        this.terminateByDefault = terminateByDefault
    }

    public toString(): string {
        return this.name
    }

    public get exitCode(): number {
        return this.number + 128
    }

    public static readonly SIGINT = new Signal('SIGINT', 2, true)
    public static readonly SIGKILL = new Signal('SIGKILL', 9, true)
}
