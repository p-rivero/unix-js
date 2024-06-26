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
    public readonly environmentVariables: Record<string, string>
    private currentDirectory: Directory
    private readonly fileStreams: (File | undefined)[]
    
    public constructor(context: ExecutionContext)
    public constructor(dto: DirectoryDTO, env: Record<string, string>)
    public constructor(obj: DirectoryDTO | ExecutionContext, env?: Record<string, string>) {
        if (obj instanceof ExecutionContext) {
            this.fileStreams = obj.fileStreams
            this.rootDirectory = obj.rootDirectory
            this.currentDirectory = obj.currentDirectory
            this.environmentVariables = { ...obj.environmentVariables }
        } else {
            if (env?.HOME === undefined) {
                throw new InvalidArgument('The HOME environment variable must be specified')
            }
            this.fileStreams = []
            this.rootDirectory = new RootDirectory(obj)
            this.environmentVariables = { ...env }
            this.currentDirectory = this.homeDirectory
        }
    }

    public get currentWorkingDirectory(): Directory {
        return this.currentDirectory
    }

    public get homeDirectory(): Directory {
        const path = new FilesystemPath(this.environmentVariables.HOME)
        if (!path.isAbsolute) {
            throw new InvalidArgument(`The home path '${this.environmentVariables.HOME}' must be absolute`)
        }
        try {
            const home = this.rootDirectory.resolvePath(path.parts)
            assert(home instanceof Directory)
            return home
        } catch (error) {
            throw new InvalidArgument(`The home path '${this.environmentVariables.HOME}' must point to an existing directory`)
        }
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
        this.currentDirectory = this.resolvePath(path, allowHidden).asDirectory()
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

    private baseDirectory(path: FilesystemPath): Directory {
        if (path.isAbsolute) {
            return this.rootDirectory
        } else if (path.isRelativeToHome) {
            return this.homeDirectory
        } 
        return this.currentDirectory
    }
}
