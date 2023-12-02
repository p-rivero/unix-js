
export abstract class IOStream {
    public abstract read(): string
    public abstract write(content: string): void
}

export class IOStreams {
    public readonly stdin: IOStream
    public readonly stdout: IOStream
    public readonly stderr: IOStream

    public constructor(streams: [IOStream, IOStream, IOStream] | IOStreams) {
        if (streams instanceof IOStreams) {
            this.stdin = streams.stdin
            this.stdout = streams.stdout
            this.stderr = streams.stderr
        } else {
            [this.stdin, this.stdout, this.stderr] = streams
        }
    }
}

export class PipeStream extends IOStream {
    private readonly buffer: Buffer

    public constructor() {
        super()
        this.buffer = Buffer.alloc(0)
    }

    public override read(): string {
        return this.buffer.toString()
    }

    public override write(content: string): void {
        this.buffer.write(content)
    }
}

export class DebugStream extends IOStream {
    public override read(): string {
        const buffer = process.stdin.read() as Buffer
        return buffer.toString()
    }

    public override write(content: string): void {
        process.stdout.write(content)
    }
}
