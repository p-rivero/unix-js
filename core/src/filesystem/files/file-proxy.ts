import type { File, FileHandle } from 'filesystem/files/file'
import { FilesystemNodeProxy } from 'filesystem/filesystem-node-proxy'

export class FileHandleProxy {
    private readonly fileHandle: FileHandle
    private readonly checkInterrupted: () => Promise<void>

    public constructor(fileHandle: FileHandle, checkInterrupted: () => Promise<void>) {
        this.fileHandle = fileHandle
        this.checkInterrupted = checkInterrupted
    }

    /**
     * Returns the current position of the file handle (number of characters from the start of the file).
     */
    public get position(): number {
        return this.fileHandle.position
    }

    /**
     * Reads up to a maximum number of characters from the file, starting from the current position.
     * The position advances by the number of characters read.
     * @param maxNumChars The maximum number of characters to read
     * @returns The content read from the file
     */
    public async read(maxNumChars: number): Promise<string> {
        await this.checkInterrupted()
        return this.fileHandle.read(maxNumChars)
    }

    /**
     * Reads until the next newline character, starting from the current position.
     * The position advances by the number of characters read.
     * @returns The line read from the file
     */
    public async readLine(): Promise<string> {
        await this.checkInterrupted()
        return this.fileHandle.readLine()
    }

    /**
     * Writes content to the file at the current position.
     * The position advances by the number of characters written.
     * @param content The content to write
     * @param truncateAfter If `true`, all data after the written content will be removed.
     * If `false` (default), the new content will overwrite the old characters without changing the file length.
     */
    public async write(content: string, truncateAfter = false): Promise<void> {
        await this.checkInterrupted()
        await this.fileHandle.write(content, truncateAfter)
    }

    /**
     * Sets the position of the file handle.
     * @param position The new position (number of characters from the start of the file)
     */
    public seek(position: number): void {
        this.fileHandle.seek(position)
    }
}


export class FileProxy extends FilesystemNodeProxy {
    protected override readonly wrapped: File

    public constructor(file: File, checkInterrupted: () => Promise<void>) {
        super(file, checkInterrupted)
        this.wrapped = file
    }

    /**
     * Returns `true` if the file can be written to.  
     * If `false`, writing to the file will throw a `PermissionDenied` error.
     */
    public get writable(): boolean {
        return this.wrapped.writable
    }

    /**
     * Returns `true` if the file can be executed.  
     * If `false`, executing the file will throw a `PermissionDenied` error.
     */
    public get executable(): boolean {
        return this.wrapped.executable
    }

    /**
     * Reads the entire content of the file (or executes the `read` method if the file is a device).
     * @returns The content of the file
     */
    public async read(): Promise<string> {
        await this.checkInterrupted()
        return this.wrapped.read()
    }

    /**
     * Writes content to the file (or executes the `write` method if the file is a device).
     * @param content The content to write
     * @param append If `true`, the content will be appended to the file. If `false` (default), the file will be cleared before writing.
     */
    public async write(content: string, append = false): Promise<void> {
        await this.checkInterrupted()
        await this.wrapped.write(content, append)
    }

    /**
     * Appends content to the file. Corresponds to `write(content, true)`.
     * @param content The content to append
     */
    public async append(content: string): Promise<void> {
        await this.write(content, true)
    }

    /**
     * @private
     * Direct access to the underlying virtual file. Reserved for internal use, do not use it unless you know what you're doing.
     */
    public override _unwrap(): File {
        return this.wrapped
    }

}
