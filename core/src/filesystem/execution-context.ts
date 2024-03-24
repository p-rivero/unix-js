import { InternalError, InvalidArgument } from 'errors'
import { Directory, type DirectoryDTO } from 'filesystem/directories/directory'
import { RootDirectory } from 'filesystem/directories/root-directory'
import { DeviceFile } from 'filesystem/files/device-file'
import type { File } from 'filesystem/files/file'
import type { FilesystemNode } from 'filesystem/filesystem-node'
import { FilesystemPath } from 'filesystem/filesystem-path'
import { assert } from 'utils'


export class ExecutionContext {
    public readonly rootDirectory: RootDirectory
    public readonly homeDirectory: Directory
    private currentDirectory: Directory
    private readonly fileStreams: (File | undefined)[]
    
    public constructor(context: ExecutionContext)
    public constructor(dto: DirectoryDTO, homePath: string)
    public constructor(obj: DirectoryDTO | ExecutionContext, homePath?: string) {
        if (obj instanceof ExecutionContext) {
            this.fileStreams = obj.fileStreams
            this.rootDirectory = obj.rootDirectory
            this.homeDirectory = obj.homeDirectory
            this.currentDirectory = obj.currentDirectory
        } else {
            if (homePath === undefined) {
                throw new InvalidArgument('The home path must be specified')
            }
            this.fileStreams = []
            this.rootDirectory = new RootDirectory(obj)
            this.homeDirectory = ExecutionContext.getHomeDirectory(this.rootDirectory, homePath)
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
        while (index >= this.fileStreams.length) {
            this.fileStreams.push(undefined)
        }
        this.fileStreams[index] = file
    }

    public resolvePath(path: string, allowHidden = false): FilesystemNode {
        const pathObj = new FilesystemPath(path)
        return this.baseDirectory(pathObj).resolvePath(pathObj.parts, allowHidden)
    }

    public changeDirectory(path: string, allowHidden = false): void {
        const pathObj = new FilesystemPath(path)
        this.currentDirectory = this.baseDirectory(pathObj).resolvePath(pathObj.parts, allowHidden).asDirectory()
    }

    public createPipe(): [File, File] {
        let buffer = ''
    
        const pipeOut = new DeviceFile({
            name: 'pipeIn',
            type: 'device-file',
            permissions: 'read-only',
            generator: () => ({
                read: numChars => {
                    const readLength = numChars ?? buffer.length
                    const content = buffer.slice(0, readLength)
                    buffer = buffer.slice(readLength)
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
                    buffer += content
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
