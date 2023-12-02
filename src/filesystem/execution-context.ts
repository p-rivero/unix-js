import { InvalidArgument } from '@/errors'
import { NoSuchFileOrDirectory } from '@/errors/filesystem'
import { Directory, type DirectoryDTO } from '@/filesystem/directories/directory'
import { RootDirectory } from '@/filesystem/directories/root-directory'
import type { FilesystemNode } from '@/filesystem/filesystem-node'
import { FilesystemPath } from '@/filesystem/filesystem-path'

export interface ExecutionContextDTO {
    readonly filesystemTree: DirectoryDTO
    readonly homePath: string
}

export class ExecutionContext {
    public readonly rootDirectory: RootDirectory
    public readonly homeDirectory: Directory
    private currentDirectory: Directory

    public constructor(dto: ExecutionContextDTO) {
        this.rootDirectory = new RootDirectory(dto.filesystemTree)
        this.homeDirectory = ExecutionContext.getHomeDirectory(this.rootDirectory, dto.homePath)
        this.currentDirectory = this.homeDirectory
    }

    public get currentWorkingDirectory(): Directory {
        return this.currentDirectory
    }
    
    private static getHomeDirectory(root: RootDirectory, homePath: string): Directory {
        const path = new FilesystemPath(homePath)
        if (!path.isAbsolute) {
            throw new InvalidArgument('The home path must be absolute')
        }
        try {
            const home = root.internalResolvePath(path.parts)
            if (!(home instanceof Directory)) {
                throw new InvalidArgument('The home path must point to a directory')
            }
            return home
        } catch (error) {
            if (error instanceof NoSuchFileOrDirectory) {
                throw new InvalidArgument(`The home '${homePath}' does not exist`)
            }
            throw error
        }
    }

    public displayResolvePath(pathStr: string): FilesystemNode {
        const path = new FilesystemPath(pathStr)
        return this.baseDirectory(path).displayResolvePath(path.parts)
    }

    public internalResolvePath(pathStr: string): FilesystemNode {
        const path = new FilesystemPath(pathStr)
        return this.baseDirectory(path).internalResolvePath(path.parts)
    }

    public displayChangeDirectory(pathStr: string): void {
        const path = new FilesystemPath(pathStr)
        this.currentDirectory = this.baseDirectory(path).displayResolvePath(path.parts) as Directory
    }
    public internalChangeDirectory(pathStr: string): void {
        const path = new FilesystemPath(pathStr)
        this.currentDirectory = this.baseDirectory(path).internalResolvePath(path.parts) as Directory
    }

    private baseDirectory(path: FilesystemPath): Directory {
        if (path.isAbsolute) {
            return this.rootDirectory
        } else if (path.isRelativeToHome) {
            return this.homeDirectory
        } 
        return this.currentDirectory
    }
}
