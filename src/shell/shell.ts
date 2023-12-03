import assert from 'assert'
import { InvalidArgument, UnixJsError } from 'errors'
import { ShellCommandFailure } from 'errors/shell'
import { Directory } from 'filesystem/directories/directory'
import type { ExecutionContext } from 'filesystem/execution-context'
import { File } from 'filesystem/files/file'

export interface ShellConfig {
    readonly internalCommandDirectories: readonly string[]
    readonly stdinFile: string
    readonly stdoutFile: string
    readonly stderrFile: string
}

export class Shell {
    private readonly context: ExecutionContext
    private readonly commandDirectories: readonly Directory[]

    public constructor(context: ExecutionContext, config: ShellConfig) {
        this.context = context
        this.commandDirectories = config.internalCommandDirectories.map(path => this.internalGetDirectory(path))
        this.context.stdin = this.internalGetFile(config.stdinFile)
        this.context.stdout = this.internalGetFile(config.stdoutFile)
        this.context.stderr = this.internalGetFile(config.stderrFile)
    }

    public execute(command: string): number {
        const [commandName, ...args] = command.split(' ')
        const commandFile = this.displayFindCommand(commandName)
        try {
            return commandFile.execute(this.context, args)
        } catch (error) {
            if (error instanceof UnixJsError) {
                throw new ShellCommandFailure(commandName, error)
            }
            throw error
        }
    }

    private internalGetDirectory(path: string): Directory {
        try {
            const node = this.context.internalResolvePath(path)
            assert(node instanceof Directory)
            return node
        } catch (error) {
            throw new InvalidArgument(`Directory path ${path} must point to a directory`)
        }
    }

    private internalGetFile(path: string): File {
        try {
            const node = this.context.internalResolvePath(path)
            assert(node instanceof File)
            return node
        } catch (error) {
            throw new InvalidArgument(`File path ${path} must point to an existing file`)
        }
    }

    private displayFindCommand(commandName: string): File {
        for (const directory of this.commandDirectories) {
            try {
                const commandFile = directory.displayGetChild(commandName)
                assert(commandFile instanceof File && commandFile.executable)
                return commandFile
            } catch (error) {
                // Continue searching
            }
        }
        try {
            const commandFile = this.context.displayResolvePath(commandName)
            assert(commandFile instanceof File)
            return commandFile
        } catch (error) {
            if (error instanceof UnixJsError) {
                throw new ShellCommandFailure(commandName, error)
            }
            throw error
        }
    }
}
