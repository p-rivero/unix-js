import { PermissionDenied } from 'errors'
import type { Directory } from 'filesystem/directories/directory'
import type { ExecutableMethods } from 'filesystem/files/executable-types'
import { FilesystemNode, type FilesystemNodeDTO } from 'filesystem/filesystem-node'
import type { ProcessProxy } from 'processes/process-proxy'

export type FilePermission = 'read-only' | 'read-write' | 'execute'

export interface FileDTO extends FilesystemNodeDTO {
    readonly permissions?: FilePermission
}

export type ImplementReadSignature = (range?: [number, number]) => Promise<string>
export type ImplementWriteSignature = (content: string, position: number | undefined, truncate: boolean) => Promise<void>

export class FileHandle {
    private readonly file: File
    private readonly implementRead: ImplementReadSignature
    private readonly implementWrite: ImplementWriteSignature
    private cursor = 0

    public constructor(file: File, implementRead: ImplementReadSignature, implementWrite: ImplementWriteSignature) {
        this.file = file
        this.implementRead = implementRead
        this.implementWrite = implementWrite
    }

    public get position(): number {
        return this.cursor
    }

    public async read(maxNumChars: number): Promise<string> {
        if (!this.file.isReadable) {
            throw new PermissionDenied()
        }
        const start = this.cursor
        const end = start + maxNumChars
        const content = await this.implementRead([start, end])
        this.cursor = start + content.length
        return content
    }

    public async readLine(): Promise<string> {
        let content = ''
        let char = await this.read(1)
        while (char !== '\n' && char !== '') {
            content += char
            char = await this.read(1)
        }
        return content
    }

    public async write(content: string, truncateAfter = false): Promise<void> {
        if (!this.file.writable) {
            throw new PermissionDenied()
        }
        await this.implementWrite(content, this.cursor, truncateAfter)
        this.cursor += content.length
    }

    public seek(position: number): void {
        this.cursor = Math.max(0, position)
    }
}

export abstract class File extends FilesystemNode {
    private readonly permissions: FilePermission

    protected constructor(dto: FileDTO, parent: Directory) {
        super(dto, parent)
        this.permissions = dto.permissions ?? 'read-write'
    }

    public get writable(): boolean {
        return this.isReadable && this.permissions === 'read-write'
    }

    public get executable(): boolean {
        return this.isReadable && this.permissions === 'execute'
    }

    public open(): FileHandle {
        return new FileHandle(this, this.implementRead, this.implementWrite)
    }

    public async read(): Promise<string> {
        if (!this.isReadable) {
            throw new PermissionDenied()
        }
        return this.implementRead()
    }
    protected abstract implementRead: ImplementReadSignature

    public async write(content: string, append = false): Promise<void> {
        if (!this.writable) {
            throw new PermissionDenied()
        }
        const overwriteFrom = append ? undefined : 0
        await this.implementWrite(content, overwriteFrom, true)
    }
    protected abstract implementWrite: ImplementWriteSignature
    
    public getExecutable(process: ProcessProxy): ExecutableMethods {
        if (!this.executable) {
            throw new PermissionDenied()
        }
        return this.implementGetExecutable(process)
    }
    protected abstract implementGetExecutable(process: ProcessProxy): ExecutableMethods
}
