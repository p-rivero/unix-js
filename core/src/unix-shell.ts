import { InvalidArgument } from 'errors'
import type { DirectoryDTO } from 'filesystem/directories/directory'
import { ExecutionContext } from 'filesystem/execution-context'
import type { File } from 'filesystem/files/file'
import { ProcessTable } from 'processes/process-table'
import { Signal } from 'processes/signal'

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
    readonly echoCtrlC: boolean
}

export interface UnixConfig {
    readonly filesystemRoot: DirectoryDTO
    readonly environmentVariables: Record<string, string> & { HOME: string; PATH?: string }
    readonly shell: ShellConfig
}

export class UnixShell {
    private readonly context: ExecutionContext
    private readonly startupCommand: ShellConfigStartup
    private readonly processTable: ProcessTable
    private readonly echoCtrlC: boolean

    public constructor(config: UnixConfig) {
        this.context = new ExecutionContext(config.filesystemRoot, config.environmentVariables)
        for (const { index, absolutePath: internalPath } of config.shell.standardStreams) {
            const file = this.getFile(internalPath)
            this.context.setFileStream(index, file)
        }
        this.processTable = new ProcessTable(this.context)
        this.startupCommand = config.shell.startupCommand
        this.echoCtrlC = config.shell.echoCtrlC
    }

    public async start(): Promise<number> {
        const commandFile = this.getFile(this.startupCommand.absolutePath)
        const pid = this.processTable.startProcess(null, commandFile, this.startupCommand.args)
        return this.processTable.waitToFinish(pid)
    }

    public async interrupt(): Promise<void> {
        if (this.echoCtrlC) {
            await this.context.getFileStream(0).write('^C')
        }
        await this.processTable.sendGroupSignal(null, Signal.SIGINT)
    }

    private getFile(path: string): File {
        try {
            return this.context.resolvePath(path, true).asFile()
        } catch (error) {
            throw new InvalidArgument(`File path ${path} must point to an existing file`)
        }
    }
}
