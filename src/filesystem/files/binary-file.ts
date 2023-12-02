import { PermissionDenied } from '@/errors'
import { BINARY_FILE_REPRESENTATION } from '@/filesystem/constants'
import type { Directory } from '@/filesystem/directories/directory'
import { File, type FileDTO } from '@/filesystem/files/file'
import type { IOStreams } from '@/input-output/io-stream'

export type Executable = (streams: IOStreams) => number | undefined

export interface BinaryFileDTO extends FileDTO {
    readonly type: 'binary-file'
    readonly permissions: 'read-only' | 'execute'
    readonly executable: Executable
}

export class BinaryFile extends File {
    private content: Executable

    public constructor(dto: BinaryFileDTO, parent: Directory) {
        super(dto, parent)
        this.content = dto.executable
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

    public override implementExecute(streams: IOStreams): number {
        return this.content(streams) ?? 0
    }
}
