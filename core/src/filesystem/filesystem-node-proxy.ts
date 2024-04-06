import { Directory } from 'filesystem/directories/directory'
import { DirectoryProxy } from 'filesystem/directories/directory-proxy'
import { File } from 'filesystem/files/file'
import { FileProxy } from 'filesystem/files/file-proxy'
import type { FilesystemNode } from 'filesystem/filesystem-node'

export abstract class FilesystemNodeProxy {
    protected readonly wrapped: FilesystemNode
    protected readonly checkInterrupted: () => Promise<void>

    protected constructor(wrapped: FilesystemNode, checkInterrupted: () => Promise<void>) {
        this.wrapped = wrapped
        this.checkInterrupted = checkInterrupted
    }

    /**
     * @private
     * User programs don't need to call this method.
     */
    public static wrap(node: FilesystemNode, checkInterrupted: () => Promise<void>): FilesystemNodeProxy {
        if (node instanceof Directory) {
            return new DirectoryProxy(node, checkInterrupted)
        } else if (node instanceof File) {
            return new FileProxy(node, checkInterrupted)
        } 
        throw new Error('Unknown filesystem node type')
    }

    /**
     * Returns `true` if the file can be read.  
     * If `false`, reading from the file will throw a `PermissionDenied` error.
     */
    public get readable(): boolean {
        return this.wrapped.isReadable
    }

    /**
     * Returns the absoulte path of the file in the virtual filesystem.
     */
    public get absolutePath(): string {
        return this.wrapped.absolutePath
    }

    /**
     * Casts `this` to a `File`
     * @throws IsADirectory if `this` is not a `File`
     */
    public asFile(): FileProxy {
        return new FileProxy(this.wrapped.asFile(), this.checkInterrupted)
    }

    /**
     * Casts `this` to a `Directory`
     * @throws NotADirectory if `this` is not a `Directory`
     */
    public asDirectory(): DirectoryProxy {
        return new DirectoryProxy(this.wrapped.asDirectory(), this.checkInterrupted)
    }

    /**
     * @private
     * Direct access to the underlying virtual file. Reserved for internal use, do not use it unless you know what you're doing.
     */
    public _unwrap(): FilesystemNode {
        return this.wrapped
    }

}
