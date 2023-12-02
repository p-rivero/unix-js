import { InternalError, InvalidArgument } from '@/errors'
import { PATH_SEPARATOR } from '@/filesystem/constants'
import { Directory } from '@/filesystem/directories/directory'
import assert from 'assert'

export type AccessType = 'hidden' | 'locked' | 'readable'

export interface FilesystemNodeDTO {
    readonly internalName: string
    readonly displayName?: string
    readonly accessType?: AccessType
}

export abstract class FilesystemNode {
    public readonly internalName: string
    public readonly displayName: string
    public readonly accessType: AccessType
    public readonly parent: Directory

    protected constructor(dto: FilesystemNodeDTO, parent?: Directory) {
        this.internalName = dto.internalName
        this.displayName = dto.displayName ?? dto.internalName
        this.accessType = dto.accessType ?? 'readable'
        this.assertNameIsValid()
        if (parent) {
            this.parent = parent
        } else if (this instanceof Directory) {
            this.parent = this
        } else {
            throw new InternalError('The filesystem root must be a directory')
        }
    }

    public get visible(): boolean {
        return this.accessType !== 'hidden'
    }

    public get readable(): boolean {
        return this.accessType === 'readable'
    }

    public get displayAbsolutePath(): string {
        return this.getAbsolutePath('displayName')
    }

    public get internalAbsolutePath(): string {
        return this.getAbsolutePath('internalName')
    }

    protected getAbsolutePath(attribute: keyof FilesystemNode): string {
        const name = this[attribute]
        assert(typeof name === 'string')
        return this.parent.getAbsolutePath(attribute) + PATH_SEPARATOR + name
    }

    private assertNameIsValid(): void {
        function check(name: string, nameType: string): void {
            if (name.includes(PATH_SEPARATOR)) {
                throw new InvalidArgument(`${nameType} '${name}' cannot contain '${PATH_SEPARATOR}'`)
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
