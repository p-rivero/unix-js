import assert from 'assert'
import { InternalError, InvalidArgument } from 'errors'
import { Directory, type DirectoryDTO } from 'filesystem/directories/directory'
import { RootDirectory } from 'filesystem/directories/root-directory'
import { DeviceFile } from 'filesystem/files/device-file'
import type { File } from 'filesystem/files/file'
import type { FilesystemNode } from 'filesystem/filesystem-node'
import { FilesystemPath } from 'filesystem/filesystem-path'

export interface ExecutionContextDTO {
    readonly filesystemTree: DirectoryDTO
    readonly homePath: string
}

export class ExecutionContext {
    public readonly rootDirectory: RootDirectory
    public readonly homeDirectory: Directory
    private currentDirectory: Directory
    private stdinFile?: File
    private stdoutFile?: File
    private stderrFile?: File
    
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
    public set stdin(file: File) {
        this.stdinFile = file
    }

    public get stdout(): File {
        if (!this.stdoutFile) {
            throw new InternalError('Shell did not initialize stdout file')
        }
        return this.stdoutFile
    }
    public set stdout(file: File) {
        this.stdoutFile = file
    }

    public get stderr(): File {
        if (!this.stderrFile) {
            throw new InternalError('Shell did not initialize stderr file')
        }
        return this.stderrFile
    }
    public set stderr(file: File) {
        this.stderrFile = file
    }
    
    private static getHomeDirectory(root: RootDirectory, homePath: string): Directory {
        const path = new FilesystemPath(homePath)
        if (!path.isAbsolute) {
            throw new InvalidArgument('The home path must be absolute')
        }
        try {
            const home = root.internalResolvePath(path.parts)
            assert(home instanceof Directory)
            return home
        } catch (error) {
            throw new InvalidArgument(`The home path '${homePath}' must point to an existing directory`)
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
            generator: () => ({
                read: () => {
                    const content = buffer.join('')
                    buffer.splice(0, buffer.length)
                    return content
                }
            })
        }, this.currentDirectory)
    
        const pipeIn = new DeviceFile({
            internalName: 'pipeOut',
            type: 'device-file',
            permissions: 'read-write',
            generator: () => ({
                write: content => buffer.push(content)
            })
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
