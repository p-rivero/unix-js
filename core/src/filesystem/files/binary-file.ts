import { PermissionDenied } from 'errors'
import { BINARY_FILE_REPRESENTATION } from 'filesystem/constants'
import type { Directory } from 'filesystem/directories/directory'
import type { ExecutionContext } from 'filesystem/execution-context'
import { File, type FileDTO, type ImplementExecuteSignature, type ImplementReadSignature, type ImplementWriteSignature } from 'filesystem/files/file'
import type { Signal } from 'process/signal'

export type ExecutableRet = number | undefined | Promise<number | undefined>
export type Executable = (context: ExecutionContext, args: string[]) => ExecutableRet

export interface BinaryFileMethods {
    execute: Executable
    handleSignal?: (signal: Signal) => void
}

export interface BinaryFileDTO extends FileDTO {
    readonly type: 'binary-file'
    readonly permissions?: 'read-only' | 'execute'
    readonly generator: () => BinaryFileMethods
}

export class BinaryFile extends File {
    private readonly executeFn: Executable
    private readonly handleSignal: (signal: Signal) => void

    public constructor(dto: BinaryFileDTO, parent: Directory) {
        super(dto, parent)
        this.executeFn = dto.generator().execute
        this.handleSignal = dto.generator().handleSignal ?? (() => { /* no-op */ })
    }

    public override implementRead: ImplementReadSignature = async() => Promise.resolve(BINARY_FILE_REPRESENTATION)

    public override implementWrite: ImplementWriteSignature = () => {
        throw new PermissionDenied()
    }

    public override implementExecute: ImplementExecuteSignature = async(context, args) => {
        const ret = await this.executeFn(context, args)
        return ret ?? 0
    }
}
