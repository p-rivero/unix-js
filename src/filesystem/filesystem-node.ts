import { InvalidArgument } from '@/errors/internal'
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
        this.assertNameIsValid()
        if (parent) {
            this.parent = parent
        } else if (this instanceof Directory) {
            this.parent = this
        } else {
            throw new InvalidArgument('The filesystem root must be a directory')
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

    private assertNameIsValid(): void {
        function check(name: string, nameType: string): void {
            if (name.includes('/')) {
                throw new InvalidArgument(`${nameType} '${name}' cannot contain '/'`)
            }
            if (name === '') {
                throw new InvalidArgument(`${nameType} cannot be empty`)
            }
            if (name === '.' || name === '..') {
                throw new InvalidArgument(`${nameType} cannot be "." or ".."`)
            }
        }
        check(this.internalName, 'Internal name')
        check(this.displayName, 'Display name')
    }
}
