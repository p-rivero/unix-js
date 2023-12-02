import { PermissionDenied } from '@/errors'
import type { Directory } from '@/filesystem/directory'
import { FilesystemNode, type FilesystemNodeDTO } from '@/filesystem/filesystem-node'

export interface TextFileDTO extends FilesystemNodeDTO {
    readonly type: 'text-file'
    readonly content: string
    readonly writable?: boolean
}

export class TextFile extends FilesystemNode {
    private readonly writePermission: boolean
    private content: string

    public constructor(dto: TextFileDTO, parent: Directory) {
        super(dto, parent)
        this.content = dto.content
        this.writePermission = dto.writable ?? true
    }

    public get writable(): boolean {
        return this.readable && this.writePermission
    }

    public displayRead(): string {
        if (!this.readable) {
            throw new PermissionDenied()
        }
        return this.content
    }

    public displayWrite(content: string): void {
        if (!this.writable) {
            throw new PermissionDenied()
        }
        this.content = content
    }

    public internalRead(): string {
        return this.content
    }

    public internalWrite(content: string): void {
        this.content = content
    }
}
