import assert from 'assert'
import { InvalidArgument, UnixJsError } from 'errors'
import { ShellCommandFailure } from 'errors/shell'
import { Directory } from 'filesystem/directories/directory'
import type { ExecutionContext } from 'filesystem/execution-context'
import { File } from 'filesystem/files/file'

export interface ShellConfigStartupCommand {
    readonly command: string
    readonly args: readonly string[]
}

export interface ShellConfigStandardStream {
    readonly index: number
    readonly internalPath: string
}

export interface ShellConfig {
    readonly commandDirectories: readonly string[]
    readonly standardStreams: ShellConfigStandardStream[]
    readonly startupCommand: ShellConfigStartupCommand
}

export class Shell {
    private readonly context: ExecutionContext
    private readonly commandDirectories: readonly Directory[]
    private readonly startupCommand: ShellConfigStartupCommand

    public constructor(context: ExecutionContext, config: ShellConfig) {
        this.context = context
        this.commandDirectories = config.commandDirectories.map(path => this.getDirectory(path))
        for (const { index, internalPath } of config.standardStreams) {
            const file = this.getFile(internalPath)
            this.context.setFileStream(index, file)
        }
        this.startupCommand = config.startupCommand
    }

    public async start(): Promise<number> {
        return this.execute(this.startupCommand.command, this.startupCommand.args, true)
    }

    public async execute(command: string, args: readonly string[], allowHidden = false): Promise<number> {
        const commandFile = this.findCommand(command, allowHidden)
        try {
            return await commandFile.execute(this.context, args)
        } catch (error) {
            if (error instanceof UnixJsError) {
                throw new ShellCommandFailure(command, error)
            }
            throw error
        }
    }

    private getDirectory(path: string): Directory {
        try {
            const node = this.context.resolvePath(path, true)
            assert(node instanceof Directory)
            return node
        } catch (error) {
            throw new InvalidArgument(`Directory path ${path} must point to a directory`)
        }
    }

    private getFile(path: string): File {
        try {
            const node = this.context.resolvePath(path, true)
            assert(node instanceof File)
            return node
        } catch (error) {
            throw new InvalidArgument(`File path ${path} must point to an existing file`)
        }
    }

    private findCommand(commandName: string, allowHidden: boolean): File {
        const command = this.findCommandInCommandDirectories(commandName, allowHidden)
        if (command !== null) {
            return command
        }
        const commandOrError = this.findCommandInCurrentDirectory(commandName, allowHidden)
        if (commandOrError instanceof File) {
            return commandOrError
        }
        throw new ShellCommandFailure(commandName, commandOrError)
    }

    private findCommandInCommandDirectories(commandName: string, allowHidden: boolean): File | null {
        for (const directory of this.commandDirectories) {
            try {
                const commandFile = directory.getChild(commandName, allowHidden)
                assert(commandFile instanceof File && commandFile.executable)
                return commandFile
            } catch (error) {
                // Continue searching
            }
        }
        return null
    }

    private findCommandInCurrentDirectory(commandName: string, allowHidden: boolean): File | UnixJsError {
        try {
            const commandFile = this.context.resolvePath(commandName, allowHidden)
            assert(commandFile instanceof File)
            return commandFile
        } catch (error) {
            if (error instanceof UnixJsError) {
                return error
            }
            throw error
        }
    }
}
