import type { DirectoryDTO } from 'filesystem/directories/directory'
import { ExecutionContext } from 'filesystem/execution-context'
import { Shell, type ShellConfig } from 'shell/shell'

export interface UnixConfig {
    readonly filesystemRoot: DirectoryDTO
    readonly homePath: string
    readonly shell: ShellConfig
}

export class Unix {
    private readonly executionContext: ExecutionContext
    private readonly shell: Shell

    public constructor(config: UnixConfig) {
        this.executionContext = new ExecutionContext(config.filesystemRoot, config.homePath)
        this.shell = new Shell(this.executionContext, config.shell)
    }

    public async start(): Promise<number> {
        return this.shell.start()
    }
}
