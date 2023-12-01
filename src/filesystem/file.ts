import type { Directory } from '@/filesystem/directory'
import { FilesystemNode, type FilesystemNodeDTO } from '@/filesystem/filesystem-node'

export interface FileDTO extends FilesystemNodeDTO {
    readonly type: 'file'
    readonly content: string
}

export class File extends FilesystemNode {
    public readonly content: string

    public constructor(dto: FileDTO, parent: Directory) {
        super(dto, parent)
        this.content = dto.content
    }
}
