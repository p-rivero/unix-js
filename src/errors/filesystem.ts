import { UnixJsError } from '@/errors'

export abstract class FilesystemError extends UnixJsError { }

export class NoSuchFileOrDirectory extends FilesystemError {
    public constructor() {
        super('The requested file or directory was not found.', 2, 'ENOENT', 'No such file or directory')
        this.name = 'NoSuchFileOrDirectory'
    }
}

export class NotADirectory extends FilesystemError {
    public constructor() {
        super('This operation requires a directory instead of a file.', 20, 'ENOTDIR', 'Not a directory')
        this.name = 'NotADirectory'
    }
}

export class IsADirectory extends FilesystemError {
    public constructor() {
        super('This operation requires a file instead of a directory.', 21, 'EISDIR', 'Is a directory')
        this.name = 'IsADirectory'
    }
}
