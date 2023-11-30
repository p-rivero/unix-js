import { PATH_SEPARATOR } from '@/filesystem/constants'
import type { Directory, DirectoryDTO } from '@/filesystem/directory'
import type { FilesystemNode } from '@/filesystem/filesystem-node'
import { RootDirectory } from '@/filesystem/root-directory'
import { trim } from '@/utils/string-utils'

export class ExecutionContext {
    public readonly rootDirectory: RootDirectory
    private readonly currentDirectory: Directory

    public constructor(dto: DirectoryDTO) {
        this.rootDirectory = new RootDirectory(dto)
        this.currentDirectory = this.rootDirectory
    }

    public get currentWorkingDirectory(): Directory {
        return this.currentDirectory
    }

    public resolveDisplayPath(path: string): FilesystemNode {
        const [dir, pathParts] = this.parsePath(path)
        return dir.resolveDisplayPath(pathParts)
    }

    public resolveInternalPath(path: string): FilesystemNode {
        const [dir, pathParts] = this.parsePath(path)
        return dir.resolveInternalPath(pathParts)
    }

    private parsePath(path: string): [Directory, string[]] {
        const pathTrim = path.trim()
        const isAbsolute = pathTrim.startsWith(PATH_SEPARATOR)
        const pathParts = trim(pathTrim, PATH_SEPARATOR).split(PATH_SEPARATOR)
        const dir = isAbsolute ? this.rootDirectory : this.currentDirectory
        return [dir, pathParts]
    }
}
