import { ProgramExit } from 'errors/process'
import type { ExecutionContext } from 'filesystem/execution-context'
import type { File } from 'filesystem/files/file'
import type { FilesystemNode } from 'filesystem/filesystem-node'
import type { Process } from 'process/process'
import type { ProcessTable } from 'process/process-table'

type GetPendingError = () => number | undefined

export class ProcessProxy {
    private readonly process: Process
    private readonly table: ProcessTable
    private readonly context: ExecutionContext
    private readonly getPendingError: GetPendingError

    public constructor(process: Process, table: ProcessTable, context: ExecutionContext, getPendingError: GetPendingError) {
        this.process = process
        this.table = table
        this.context = context
        this.getPendingError = getPendingError
    }

    /**
     * Reading `process.stdin` is equivalent to `process.getFileStream(0)`.  
     * Writing `process.stdin=file` is equivalent to `process.setFileStream(0, file)`.
     */
    public get stdin(): File {
        return this.getFileStream(0)
    }
    public set stdin(file: File) {
        this.setFileStream(0, file)
    }

    /**
     * Reading `process.stdout` is equivalent to `process.getFileStream(1)`.  
     * Writing `process.stdout=file` is equivalent to `process.setFileStream(1, file)`.
     */
    public get stdout(): File {
        return this.getFileStream(1)
    }
    public set stdout(file: File) {
        this.setFileStream(1, file)
    }

    /**
     * Reading `process.stderr` is equivalent to `process.getFileStream(2)`.  
     * Writing `process.stderr=file` is equivalent to `process.setFileStream(2, file)`.
     */
    public get stderr(): File {
        return this.getFileStream(2)
    }
    public set stderr(file: File) {
        this.setFileStream(2, file)
    }

    /**
     * Gets a file stream of this process, given its index.  
     * Usually it's better to use `process.stdin`, `process.stdout` and `process.stderr` directly.
     * @throws InternalError if there is no file stream with the given index
     */
    public getFileStream(index: number): File {
        this.checkInterrupted()
        return this.context.getFileStream(index)
    }

    /**
     * Modifies a file stream of this process, given its index.  
     * Usually it's better to use `process.stdin`, `process.stdout` and `process.stderr` directly.
     * @throws InternalError if there is no file stream with the given index
     */
    public setFileStream(index: number, file: File): void {
        this.checkInterrupted()
        this.context.setFileStream(index, file)
    }

    /**
     * Resolves a path, which can be relative to the PWD or absolute.  
     * @throws NoSuchFileOrDirectory if the path does not exist
     * @throws NotADirectory if trying to get the child of a file
     * @returns The file or directory corresponding to the path
     */
    public resolvePath(path: string, allowHidden = false): FilesystemNode {
        this.checkInterrupted()
        return this.context.resolvePath(path, allowHidden)
    }

    /**
     * Changes the PWD of this process.
     * @throws NoSuchFileOrDirectory if the path does not exist
     * @throws NotADirectory if the path exists but is not a directory
     */
    public changeDirectory(path: string, allowHidden = false): void {
        this.checkInterrupted()
        this.context.changeDirectory(path, allowHidden)
    }

    /**
     * Gets the process ID of the current process.
     */
    public get pid(): number {
        this.checkInterrupted()
        return this.process.pid
    }

    /**
     * Stops execution of the current process.
     * @param code The exit code to return (default: 0)
     */
    public exit(code = 0): never {
        this.checkInterrupted()
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw new ProgramExit(code)
    }

    /**
     * Spawns a new background process.
     * @param executable The file to execute, or its path (see `resolvePath`)
     * @param args The arguments to pass to the executable
     * @returns The process ID of the new process
     */
    public execute(executable: File | string, args: string[], background: true): number

    /**
     * Spawns a new process and waits for it to finish.
     * @param executable The file to execute, or its path (see `resolvePath`)
     * @param args The arguments to pass to the executable
     * @returns The exit code of the process
     */
    public execute(executable: File | string, args: string[], background: false): Promise<number>

    public execute(executable: File | string, args: string[], background: boolean): number | Promise<number> {
        this.checkInterrupted()
        const file = typeof executable === 'string' ? this.resolvePath(executable).asFile() : executable
        const pid = this.table.startProcess(this.context, file, args)
        if (background) {
            return pid
        }
        return this.table.waitToFinish(pid)
    }

    private checkInterrupted(): void {
        const pendingError = this.getPendingError()
        if (pendingError !== undefined) {
            this.exit(pendingError)
        }
    }
}
