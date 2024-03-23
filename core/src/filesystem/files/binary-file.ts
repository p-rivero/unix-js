import { PermissionDenied } from 'errors'
import { BINARY_FILE_REPRESENTATION } from 'filesystem/constants'
import type { Directory } from 'filesystem/directories/directory'
import { File, type FileDTO, type ImplementExecuteSignature, type ImplementReadSignature, type ImplementWriteSignature } from 'filesystem/files/file'
import type { ProcessProxy } from 'process/process-proxy'
import type { Signal } from 'process/signal'

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- We want to allow user functions to return void
export type ExecutableRet = void | number | undefined
export type Executable = (process: ProcessProxy, args: string[]) => ExecutableRet | Promise<ExecutableRet>
export type SignalHandler = (process: ProcessProxy, signal: Signal) => void | Promise<void>

export interface BinaryFileMethods {
    execute: Executable
    handleSignal?: SignalHandler
}

export interface BinaryFileDTO extends FileDTO {
    readonly type: 'binary-file'
    readonly permissions?: 'read-only' | 'execute'
    readonly generator: () => BinaryFileMethods
}

function defaultSignalHandler(process: ProcessProxy, signal: Signal): void {
    if (signal.terminateByDefault) {
        process.exit(signal.exitCode)
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

    public override async handleSignal(process: ProcessProxy, signal: Signal): Promise<void> {
        await super.handleSignal(process, signal)
        await this.handleSignalFn(process, signal)
    }
}
