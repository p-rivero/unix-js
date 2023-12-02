import type { Directory } from '@/filesystem/directory'
import { FilesystemNode, type FilesystemNodeDTO } from '@/filesystem/filesystem-node'

export type ExecutableSignature = () => number

export interface BinaryFileDTO extends FilesystemNodeDTO {
    readonly type: 'binary-file'
    readonly executable: ExecutableSignature
}

export class BinaryFile extends FilesystemNode {
    public readonly executable: ExecutableSignature

    public constructor(dto: BinaryFileDTO, parent: Directory) {
        super(dto, parent)
        this.executable = dto.executable
    }
}
