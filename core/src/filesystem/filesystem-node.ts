import { InternalError, InvalidArgument } from 'errors'
import { IsADirectory, NotADirectory } from 'errors/filesystem'
import { PATH_SEPARATOR } from 'filesystem/constants'
import { Directory } from 'filesystem/directories/directory'
import { File } from 'filesystem/files/file'

export type AccessType = 'hidden' | 'locked' | 'normal'

export interface FilesystemNodeDTO {
    readonly name: string
    readonly accessType?: AccessType
}

export abstract class FilesystemNode {
    public readonly name: string
    public readonly accessType: AccessType
    public readonly parent: Directory

    protected constructor(dto: FilesystemNodeDTO, parent?: Directory) {
        this.name = dto.name
        this.accessType = dto.accessType ?? 'normal'
        this.assertNameIsValid()
        if (parent) {
            this.parent = parent
        } else if (this instanceof Directory) {
            this.parent = this
        } else {
            throw new InternalError('The filesystem root must be a directory')
        }
    }

    public get isVisible(): boolean {
        return this.accessType !== 'hidden'
    }

    public get isReadable(): boolean {
        return this.accessType === 'normal'
    }

    public get absolutePath(): string {
        const parentPath = this.parent.absolutePath
        return parentPath === PATH_SEPARATOR 
            ? PATH_SEPARATOR + this.name 
            : parentPath + PATH_SEPARATOR + this.name
    }

    public asFile(): File {
        if (this instanceof File) {
            return this
        }
        throw new IsADirectory()
    }

    public asDirectory(): Directory {
        if (this instanceof Directory) {
            return this
        }
        throw new NotADirectory()
    }

    private assertNameIsValid(): void {
        if (this.name.includes(PATH_SEPARATOR)) {
            throw new InvalidArgument(`File name "${this.name}" cannot contain '${PATH_SEPARATOR}'`)
        }
        if (this.name === '') {
            throw new InvalidArgument('File name cannot be empty')
        }
        if (this.name === '.' || this.name === '..') {
            throw new InvalidArgument('File name cannot be "." or ".."')
        }
    }
}
