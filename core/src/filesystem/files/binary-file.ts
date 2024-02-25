import { PermissionDenied } from 'errors'
import { BINARY_FILE_REPRESENTATION } from 'filesystem/constants'
import type { Directory } from 'filesystem/directories/directory'
import type { ExecutionContext } from 'filesystem/execution-context'
import { File, ImplementExecuteSignature, ImplementReadSignature, ImplementWriteSignature, type FileDTO } from 'filesystem/files/file'

export type ExecutableRet = number | undefined | Promise<number | undefined>
export type Executable = (context: ExecutionContext, args: string[]) => ExecutableRet

export interface BinaryFileMethods {
    execute: Executable
}

export interface BinaryFileDTO extends FileDTO {
    readonly type: 'binary-file'
    readonly permissions?: 'read-only' | 'execute'
    readonly generator: () => BinaryFileMethods
}

export class BinaryFile extends File {
    private content: Executable

    public constructor(dto: BinaryFileDTO, parent: Directory) {
        super(dto, parent)
        this.content = dto.generator().execute
    }

    public override implementRead: ImplementReadSignature = async () => BINARY_FILE_REPRESENTATION

    public override implementWrite: ImplementWriteSignature = () => {
        throw new PermissionDenied()
    }

    public internalGetExecutable(): Executable {
        return this.content
    }

    public internalSetExecutable(executable: Executable): void {
        this.content = executable
    }

    public override implementExecute: ImplementExecuteSignature = async (context, args) => {
        const ret = await this.content(context, args)
        return ret ?? 0
    }
}
