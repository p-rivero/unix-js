import { PermissionDenied } from 'errors'
import { BINARY_FILE_REPRESENTATION } from 'filesystem/constants'
import type { Directory } from 'filesystem/directories/directory'
import type { ExecutionContext } from 'filesystem/execution-context'
import { File, type FileDTO } from 'filesystem/files/file'

export type Executable = (context: ExecutionContext, args: string[]) => number | undefined

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

    public override implementRead(): string {
        return BINARY_FILE_REPRESENTATION
    }

    public override implementWrite(_content: string): void {
        throw new PermissionDenied()
    }

    public internalGetExecutable(): Executable {
        return this.content
    }

    public internalSetExecutable(executable: Executable): void {
        this.content = executable
    }

    public override implementExecute(context: ExecutionContext, args: string[]): number {
        return this.content(context, args) ?? 0
    }
}
