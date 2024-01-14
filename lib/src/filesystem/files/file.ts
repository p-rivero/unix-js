import { PermissionDenied } from 'errors'
import type { Directory } from 'filesystem/directories/directory'
import type { ExecutionContext } from 'filesystem/execution-context'
import { FilesystemNode, type FilesystemNodeDTO } from 'filesystem/filesystem-node'

export type FilePermission = 'read-only' | 'read-write' | 'execute'

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

    public async read(): Promise<string> {
        if (!this.readable) {
            throw new PermissionDenied()
        }
        return this.implementRead()
    }


    public async write(content: string): Promise<void> {
        if (!this.writable) {
            throw new PermissionDenied()
        }
        await this.implementWrite(content)
    }

    public async execute(context: ExecutionContext, args: readonly string[]): Promise<number> {
        if (!this.executable) {
            throw new PermissionDenied()
        }
        return this.implementExecute(context, [this.displayAbsolutePath, ...args])
    }

    protected abstract implementRead(): Promise<string>

    protected abstract implementWrite(content: string): Promise<void>

    protected abstract implementExecute(context: ExecutionContext, args: string[]): Promise<number>
}
