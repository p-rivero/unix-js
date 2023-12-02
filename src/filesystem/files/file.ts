import { PermissionDenied } from '@/errors'
import type { Directory } from '@/filesystem/directories/directory'
import { FilesystemNode, type FilesystemNodeDTO } from '@/filesystem/filesystem-node'
import type { IOStream, IOStreams } from '@/input-output/io-stream'

export type FilePermission = 'read-only' | 'read-write' | 'execute'
export type Executable = (inputStream: IOStream, outputStream: IOStream) => number | undefined

export interface FileDTO extends FilesystemNodeDTO {
    readonly permissions?: FilePermission
}

export abstract class File extends FilesystemNode {
    private readonly permissions: FilePermission

    protected constructor(dto: FileDTO, parent: Directory) {
        super(dto, parent)
        this.permissions = dto.permissions ?? 'read-write'
    }

    public get writable(): boolean {
        return this.readable && this.permissions === 'read-write'
    }

    public get executable(): boolean {
        return this.readable && this.permissions === 'execute'
    }

    public read(): string {
        if (!this.readable) {
            throw new PermissionDenied()
        }
        return this.implementRead()
    }


    public write(content: string): void {
        if (!this.writable) {
            throw new PermissionDenied()
        }
        this.implementWrite(content)
    }

    public execute(streams: IOStreams): number {
        if (!this.executable) {
            throw new PermissionDenied()
        }
        return this.implementExecute(streams)
    }

    protected abstract implementRead(): string

    protected abstract implementWrite(content: string): void

    protected abstract implementExecute(streams: IOStreams): number
}
