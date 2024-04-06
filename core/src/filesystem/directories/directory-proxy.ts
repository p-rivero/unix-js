import { Directory } from 'filesystem/directories/directory'
import { File } from 'filesystem/files/file'
import { FileProxy } from 'filesystem/files/file-proxy'
import type { FilesystemNode } from 'filesystem/filesystem-node'
import { FilesystemNodeProxy } from 'filesystem/filesystem-node-proxy'

export class DirectoryProxy extends FilesystemNodeProxy {
    protected override readonly wrapped: Directory

    public constructor(directory: Directory, checkInterrupted: () => Promise<void>) {
        super(directory, checkInterrupted)
        this.wrapped = directory
    }

    /**
     * Returns a list of the names of the files and directories in this directory.
     * This includes the . and .. directories.
     * @param includeHidden If `true`, hidden files and directories will be included in the list.
     * Use that option when performing internal operations that should not be visible to the user.  
     * If `false` (default), only user-visible files directories will be returned.
     */
    public getChildrenNames(includeHidden = false): string[] {
        return this.wrapped.getChildrenNames(includeHidden)
    }

    /**
     * Returns the child with the given name. For most programs it's better to use `process.resolvePath()` instead.
     * @param name The name of the child to return.
     * @param includeHidden If `true`, hidden files and directories will be included in the search.
     * Use that option when performing internal operations that should not be visible to the user.  
     * If `false` (default), only user-visible files directories will be returned.
     * @throws NoSuchFileOrDirectory if the child does not exist (or it's not visible and `includeHidden` is `false`)
     */
    public getChild(name: string, includeHidden = false): FilesystemNodeProxy {
        const child = this.wrapped.getChild(name, includeHidden)
        return DirectoryProxy.wrap(child, this.checkInterrupted)
    }

    /**
     * @private
     * Direct access to the underlying virtual file. Reserved for internal use, do not use it unless you know what you're doing.
     */
    public override _unwrap(): Directory {
        return this.wrapped
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
}
