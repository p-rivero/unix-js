import { InvalidArgument } from 'errors'
import type { ExecutionContext } from 'filesystem/execution-context'
import type { File } from 'filesystem/files/file'
import { ProcessPool } from 'process/process-pool'

export interface ShellConfigStartup {
    readonly absolutePath: string
    readonly args: readonly string[]
}

export interface ShellConfigStandardStream {
    readonly index: number
    readonly absolutePath: string
}

export interface ShellConfig {
    readonly standardStreams: ShellConfigStandardStream[]
    readonly startupCommand: ShellConfigStartup
}

export class Shell {
    private readonly context: ExecutionContext
    private readonly startupCommand: ShellConfigStartup
    private readonly processPool = new ProcessPool()

    public constructor(context: ExecutionContext, config: ShellConfig) {
        this.context = context
        for (const { index, absolutePath: internalPath } of config.standardStreams) {
            const file = this.getFile(internalPath)
            this.context.setFileStream(index, file)
        }
        this.startupCommand = config.startupCommand
    }

    public async start(): Promise<number> {
        const commandFile = this.getFile(this.startupCommand.absolutePath)
        const pid = this.processPool.startProcess(this.context, commandFile, this.startupCommand.args)
        return this.processPool.waitToFinish(pid)
    }

    private getFile(path: string): File {
        try {
            return this.context.resolvePath(path, true).asFile()
        } catch (error) {
            throw new InvalidArgument(`File path ${path} must point to an existing file`)
        }
    }
}
