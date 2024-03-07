import { PermissionDenied } from 'errors'
import { ProgramExit } from 'errors/process'
import { BINARY_FILE_REPRESENTATION } from 'filesystem/constants'
import type { Directory } from 'filesystem/directories/directory'
import type { ExecutionContext } from 'filesystem/execution-context'
import { File, type FileDTO, type ImplementExecuteSignature, type ImplementReadSignature, type ImplementWriteSignature } from 'filesystem/files/file'
import type { Signal } from 'process/signal'

export type ExecutableRet = number | undefined | Promise<number | undefined>
export type Executable = (context: ExecutionContext, args: string[]) => ExecutableRet
export type SignalHandler = (context: ExecutionContext, signal: Signal) => void | Promise<void>

export interface BinaryFileMethods {
    execute: Executable
    handleSignal?: SignalHandler
}

export interface BinaryFileDTO extends FileDTO {
    readonly type: 'binary-file'
    readonly permissions?: 'read-only' | 'execute'
    readonly generator: () => BinaryFileMethods
}

function defaultSignalHandler(_context: ExecutionContext, signal: Signal): void {
    if (signal.terminateByDefault) {
        throw new ProgramExit(128 + signal.number)
    }
}

export class BinaryFile extends File {
    private readonly executeFn: Executable
    private readonly handleSignalFn: SignalHandler

    public constructor(dto: BinaryFileDTO, parent: Directory) {
        super(dto, parent)
        this.executeFn = dto.generator().execute
        this.handleSignalFn = dto.generator().handleSignal ?? defaultSignalHandler
    }

    public override implementRead: ImplementReadSignature = async() => Promise.resolve(BINARY_FILE_REPRESENTATION)

    public override implementWrite: ImplementWriteSignature = () => {
        throw new PermissionDenied()
    }

    public override implementExecute: ImplementExecuteSignature = async(context, args) => {
        const ret = await this.executeFn(context, args)
        return ret ?? 0
    }

    public override async handleSignal(context: ExecutionContext, signal: Signal): Promise<void> {
        await super.handleSignal(context, signal)
        await this.handleSignalFn(context, signal)
    }
}
