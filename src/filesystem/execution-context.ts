import { InternalError, InvalidArgument } from '@/errors'
import { NoSuchFileOrDirectory } from '@/errors/filesystem'
import { Directory, type DirectoryDTO } from '@/filesystem/directories/directory'
import { RootDirectory } from '@/filesystem/directories/root-directory'
import { DeviceFile } from '@/filesystem/files/device-file'
import type { File } from '@/filesystem/files/file'
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
    private readonly stdinFile?: File
    private readonly stdoutFile?: File
    private readonly stderrFile?: File
    
    public constructor(dto: ExecutionContextDTO | ExecutionContext) {
        if (dto instanceof ExecutionContext) {
            this.stdinFile = dto.stdinFile
            this.stdoutFile = dto.stdoutFile
            this.stderrFile = dto.stderrFile
            this.rootDirectory = dto.rootDirectory
            this.homeDirectory = dto.homeDirectory
            this.currentDirectory = dto.currentDirectory
        } else {
            this.rootDirectory = new RootDirectory(dto.filesystemTree)
            this.homeDirectory = ExecutionContext.getHomeDirectory(this.rootDirectory, dto.homePath)
            this.currentDirectory = this.homeDirectory
        }
    }

    public get currentWorkingDirectory(): Directory {
        return this.currentDirectory
    }

    public get stdin(): File {
        if (!this.stdinFile) {
            throw new InternalError('Shell did not initialize stdin file')
        }
        return this.stdinFile
    }

    public get stdout(): File {
        if (!this.stdoutFile) {
            throw new InternalError('Shell did not initialize stdout file')
        }
        return this.stdoutFile
    }

    public get stderr(): File {
        if (!this.stderrFile) {
            throw new InternalError('Shell did not initialize stderr file')
        }
        return this.stderrFile
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

    public createPipe(): [File, File] {
        const buffer: string[] = []
    
        const pipeOut = new DeviceFile({
            internalName: 'pipeIn',
            type: 'device-file',
            permissions: 'read-only',
            onRead: () => {
                const content = buffer.join('')
                buffer.splice(0, buffer.length)
                return content
            }
        }, this.currentDirectory)
    
        const pipeIn = new DeviceFile({
            internalName: 'pipeOut',
            type: 'device-file',
            permissions: 'read-write',
            onWrite: content => buffer.push(content)
        }, this.currentDirectory)
        
        return [pipeIn, pipeOut]
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
