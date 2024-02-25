import { PermissionDenied } from 'errors'
import type { Directory } from 'filesystem/directories/directory'
import type { ExecutionContext } from 'filesystem/execution-context'
import { FilesystemNode, type FilesystemNodeDTO } from 'filesystem/filesystem-node'

export type FilePermission = 'read-only' | 'read-write' | 'execute'

export interface FileDTO extends FilesystemNodeDTO {
    readonly permissions?: FilePermission
}

export type ImplementReadSignature = (range?: [number, number]) => Promise<string>
export type ImplementWriteSignature = (content: string, position?: number) => Promise<void>
export type ImplementExecuteSignature = (context: ExecutionContext, args: string[]) => Promise<number>

export class FileHandle {
    private readonly implementRead: ImplementReadSignature
    private readonly implementWrite: ImplementWriteSignature
    private cursor = 0

    public constructor(implementRead: ImplementReadSignature, implementWrite: ImplementWriteSignature) {
        this.implementRead = implementRead
        this.implementWrite = implementWrite
    }

    public get position(): number {
        return this.cursor
    }

    public async read(maxNumChars: number): Promise<string> {
        const start = this.cursor
        const end = start + maxNumChars
        const content = await this.implementRead([start, end])
        this.cursor = start + content.length
        return content
    }

    public async write(content: string): Promise<void> {
        await this.implementWrite(content, this.cursor)
        this.cursor += content.length
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
        return new FileHandle(this.implementRead, this.implementWrite)
    }

    public get isReadable(): boolean {
        return this.permissions !== 'read-only'
    }

    public async read(): Promise<string> {
        if (!this.isReadable) {
            throw new PermissionDenied()
        }
        return this.implementRead()
    }

    public async write(content: string, append = true): Promise<void> {
        if (!this.writable) {
            throw new PermissionDenied()
        }
        const overwriteFrom = append ? undefined : 0
        await this.implementWrite(content, overwriteFrom)
    }

    public async execute(context: ExecutionContext, args: readonly string[]): Promise<number> {
        if (!this.executable) {
            throw new PermissionDenied()
        }
        return this.implementExecute(context, [this.absolutePath, ...args])
    }

    protected abstract implementRead: ImplementReadSignature

    protected abstract implementWrite: ImplementWriteSignature

    protected abstract implementExecute: ImplementExecuteSignature
}
