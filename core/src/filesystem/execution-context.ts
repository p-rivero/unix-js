import assert from 'assert'
import { InternalError, InvalidArgument } from 'errors'
import { Directory, type DirectoryDTO } from 'filesystem/directories/directory'
import { RootDirectory } from 'filesystem/directories/root-directory'
import { DeviceFile } from 'filesystem/files/device-file'
import type { File } from 'filesystem/files/file'
import type { FilesystemNode } from 'filesystem/filesystem-node'
import { FilesystemPath } from 'filesystem/filesystem-path'
import { ProcessPool } from 'process/process-pool'


export class ExecutionContext {
    public readonly rootDirectory: RootDirectory
    public readonly homeDirectory: Directory
    private currentDirectory: Directory
    private readonly fileStreams: (File | undefined)[]
    private readonly processPool: ProcessPool
    
    public constructor(context: ExecutionContext)
    public constructor(dto: DirectoryDTO, homePath: string)
    public constructor(obj: DirectoryDTO | ExecutionContext, homePath?: string) {
        if (obj instanceof ExecutionContext) {
            this.fileStreams = obj.fileStreams
            this.rootDirectory = obj.rootDirectory
            this.homeDirectory = obj.homeDirectory
            this.processPool = obj.processPool
            this.currentDirectory = obj.currentDirectory
        } else {
            if (homePath === undefined) {
                throw new InvalidArgument('The home path must be specified')
            }
            this.fileStreams = []
            this.rootDirectory = new RootDirectory(obj)
            this.homeDirectory = ExecutionContext.getHomeDirectory(this.rootDirectory, homePath)
            this.processPool = new ProcessPool()
            this.currentDirectory = this.homeDirectory
        }
    }

    public get currentWorkingDirectory(): Directory {
        return this.currentDirectory
    }

    public getFileStream(index: number): File {
        const stream = index < this.fileStreams.length ? this.fileStreams[index] : undefined
        if (stream === undefined) {
            throw new InternalError(`Shell did not initialize file stream ${index}`)
        }
        return stream
    }
    public setFileStream(index: number, file: File): void {
        if (index >= this.fileStreams.length) {
            this.fileStreams.push(file)
        } else {
            this.fileStreams[index] = file
        }
    }

    public resolvePath(pathStr: string, allowHidden = false): FilesystemNode {
        const path = new FilesystemPath(pathStr)
        return this.baseDirectory(path).resolvePath(path.parts, allowHidden)
    }

    public changeDirectory(pathStr: string, allowHidden = false): void {
        const path = new FilesystemPath(pathStr)
        this.currentDirectory = this.baseDirectory(path).resolvePath(path.parts, allowHidden) as Directory
    }

    public createPipe(): [File, File] {
        const buffer: string[] = []
    
        const pipeOut = new DeviceFile({
            name: 'pipeIn',
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
            name: 'pipeOut',
            type: 'device-file',
            permissions: 'read-write',
            generator: () => ({
                write: content => {
                    buffer.push(content) 
                }
            })
        }, this.currentDirectory)
        
        return [pipeIn, pipeOut]
    }
    
    private static getHomeDirectory(root: RootDirectory, homePath: string): Directory {
        const path = new FilesystemPath(homePath)
        if (!path.isAbsolute) {
            throw new InvalidArgument('The home path must be absolute')
        }
        try {
            const home = root.resolvePath(path.parts)
            assert(home instanceof Directory)
            return home
        } catch (error) {
            throw new InvalidArgument(`The home path '${homePath}' must point to an existing directory`)
        }
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
