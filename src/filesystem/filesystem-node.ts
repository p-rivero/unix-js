import { InternalError } from '@/errors/internal'
import { Directory } from '@/filesystem/directory'

export type FilePermissions = 'hidden' | 'locked' | 'read-only' | 'read-write' | 'execute'

export interface FilesystemNodeDTO {
    readonly internalName: string;
    readonly displayName?: string;
    readonly permissions?: FilePermissions;
    readonly type: 'directory' | 'file';
}

export abstract class FilesystemNode {
    public readonly internalName: string
    public readonly displayName: string
    public readonly permissions: FilePermissions
    public readonly parent: Directory

    protected constructor(dto: FilesystemNodeDTO, parent?: Directory) {
        this.internalName = dto.internalName
        this.displayName = dto.displayName ?? dto.internalName
        this.permissions = dto.permissions ?? 'read-write'
        if (parent) {
            this.parent = parent
        } else if (this instanceof Directory) {
            this.parent = this
        } else {
            throw new InternalError('The filesystem root must be a directory')
        }
    }

    public get visible(): boolean {
        return this.permissions !== 'hidden'
    }

    public get readable(): boolean {
        return this.permissions === 'read-only' || this.permissions === 'read-write'
    }

    public get writable(): boolean {
        return this.permissions === 'read-write'
    }

    public get executable(): boolean {
        return this.permissions === 'execute'
    }
}
