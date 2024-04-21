import { ProgramExit } from 'errors/process'
import { DirectoryProxy } from 'filesystem/directories/directory-proxy'
import type { ExecutionContext } from 'filesystem/execution-context'
import type { SignalHandler } from 'filesystem/files/executable-types'
import { FileProxy } from 'filesystem/files/file-proxy'
import type { FilesystemNodeProxy } from 'filesystem/filesystem-node-proxy'
import type { Process } from 'processes/process'
import type { ProcessTable } from 'processes/process-table'
import type { Signal } from 'processes/signal'
import { sleep } from 'utils'

interface PollMethods {
    getPendingError: () => number | Error | undefined
    isStopped: () => boolean
}

export class ProcessProxy {
    private readonly process: Process
    private readonly table: ProcessTable
    private readonly context: ExecutionContext
    private readonly methods: PollMethods

    public constructor(process: Process, table: ProcessTable, context: ExecutionContext, methods: PollMethods) {
        this.process = process
        this.table = table
        this.context = context
        this.methods = methods
    }

    /**
     * Reading `process.stdin` is equivalent to `process.getFileStream(0)`.  
     * Writing `process.stdin=file` is equivalent to `process.setFileStream(0, file)`.
     */
    public get stdin(): FileProxy {
        return this.getFileStream(0)
    }
    public set stdin(file: FileProxy) {
        this.setFileStream(0, file)
    }

    /**
     * Reading `process.stdout` is equivalent to `process.getFileStream(1)`.  
     * Writing `process.stdout=file` is equivalent to `process.setFileStream(1, file)`.
     */
    public get stdout(): FileProxy {
        return this.getFileStream(1)
    }
    public set stdout(file: FileProxy) {
        this.setFileStream(1, file)
    }

    /**
     * Reading `process.stderr` is equivalent to `process.getFileStream(2)`.  
     * Writing `process.stderr=file` is equivalent to `process.setFileStream(2, file)`.
     */
    public get stderr(): FileProxy {
        return this.getFileStream(2)
    }
    public set stderr(file: FileProxy) {
        this.setFileStream(2, file)
    }

    /**
     * Gets the environment variables of this process.
     */
    public get env(): Record<string, string> {
        return this.context.environmentVariables
    }

    /**
     * Gets a file stream of this process, given its index.  
     * Usually it's better to use `process.stdin`, `process.stdout` and `process.stderr` directly.
     * @throws InternalError if there is no file stream with the given index
     */
    public getFileStream(index: number): FileProxy {
        const file = this.context.getFileStream(index)
        return new FileProxy(file, async() => this.checkInterrupted())
    }

    /**
     * Modifies a file stream of this process, given its index.  
     * Usually it's better to use `process.stdin`, `process.stdout` and `process.stderr` directly.
     * @throws InternalError if there is no file stream with the given index
     */
    public setFileStream(index: number, file: FileProxy): void {
        // eslint-disable-next-line no-underscore-dangle -- Private API used intentionally
        this.context.setFileStream(index, file._unwrap())
    }

    /**
     * Gets the current working directory of this process.
     */
    public get currentWorkingDirectory(): DirectoryProxy {
        return new DirectoryProxy(this.context.currentWorkingDirectory, async() => this.checkInterrupted())
    }

    /**
     * Resolves a path, which can be absolute (/foo/bar), relative to the PWD (foo/bar) or relative to home (~/foo/bar).
     * @param includeHidden If `true`, hidden files and directories will be included in the search.
     * Use that option when performing internal operations that should not be visible to the user.  
     * If `false` (default), only user-visible files directories will be returned.
     * @throws NoSuchFileOrDirectory if the path does not exist
     * @throws NotADirectory if trying to get the child of a file
     * @returns The file or directory corresponding to the path
     */
    public resolvePath(path: string, allowHidden = false): FilesystemNodeProxy {
        const node = this.context.resolvePath(path, allowHidden)
        return DirectoryProxy.wrap(node, async() => this.checkInterrupted())
    }

    /**
     * Changes the PWD of this process.
     * @throws NoSuchFileOrDirectory if the path does not exist
     * @throws NotADirectory if the path exists but is not a directory
     */
    public changeDirectory(path: string, allowHidden = false): void {
        this.context.changeDirectory(path, allowHidden)
    }

    /**
     * Gets the process ID of the current process.
     */
    public get pid(): number {
        return this.process.pid
    }
    
    /**
     * Gets the process group ID of the current process.
     */
    public get pgid(): number {
        return this.process.pgid
    }

    /**
     * Stops execution of the current process.
     * @param code The exit code to return (default: 0)
     */
    public exit(code = 0): never {
        const pendingCode = this.methods.getPendingError()
        const firstCode = pendingCode ?? code
        if (firstCode instanceof Error) {
            throw firstCode
        }
        // eslint-disable-next-line @typescript-eslint/no-throw-literal -- It's better for ProgramExit not to extend Error
        throw new ProgramExit(firstCode)
    }

    /**
     * Spawns a new background process.
     * @param executable The file to execute, or its path (see `resolvePath`)
     * @param args The arguments to pass to the executable
     * @returns The process ID of the new process
     */
    public execute(executable: FileProxy | string, args: string[], background: true): Promise<number>

    /**
     * Spawns a new process and waits for it to finish.
     * @param executable The file to execute, or its path (see `resolvePath`)
     * @param args The arguments to pass to the executable
     * @returns The exit code of the process
     */
    public execute(executable: FileProxy | string, args: string[], background: false): Promise<number>

    public async execute(executable: FileProxy | string, args: string[], background: boolean): Promise<number> {
        await this.checkInterrupted()
        const file = typeof executable === 'string' ? this.resolvePath(executable).asFile() : executable
        // eslint-disable-next-line no-underscore-dangle -- Private API used intentionally
        const pid = this.table.startProcess(this.process, file._unwrap(), args)
        if (background) {
            return pid
        }
        return this.wait(pid)
    }
    
    /**
     * Waits for a process to finish.
     * @param pid The process ID of the process to wait for
     * @returns The exit code of the process
     */
    public async wait(pid: number): Promise<number> {
        await this.checkInterrupted()
        const result = await this.table.waitToFinish(pid)
        await this.checkInterrupted()
        return result
    }

    /**
     * Registers a signal handler for the current process.
     * @param signal The signal to handle
     * @param handler The function to call when the signal is received
     */
    public registerSignalHandler(signal: Signal, handler: SignalHandler): void {
        this.process.registerSignalHandler(signal, handler)
    }

    /**
     * Sends a signal to a process. The signal handling depends on the state of the process.
     * - If the process is a zombie, the signal is ignored. The promise resolves immediately.
     * - If the process is stopped (and the signal isn't `SIGCONT`), the signal is enqueued to be handled when the
     * process resumes. The promise resolves immediately.
     * - Otherwise (the process is running), the returned promise resolves when the signal handler finishes.
     * @param pid The process ID of the process to signal
     * @param signal The signal to send
     */
    public async sendSignal(pid: number, signal: Signal): Promise<void> {
        await this.checkInterrupted()
        await this.table.sendSignal(pid, signal)
        await this.checkInterrupted()
    }

    /**
     * @private
     * Direct access to the underlying process. Reserved for shell implementations, do not use it unless you know what you're doing.
     */
    public get _process(): Process {
        return this.process
    }

    /**
     * @private
     * Direct access to the underlying process table. Reserved for shell implementations, do not use it unless you know what you're doing.
     */
    public get _table(): ProcessTable {
        return this.table
    }

    /**
     * @private
     * Direct access to the underlying execution context. Reserved for shell implementations, do not use it unless you know what you're doing.
     */
    public get _context(): ExecutionContext {
        return this.context
    }

    private async checkInterrupted(): Promise<void> {
        while (this.methods.isStopped()) {
            await sleep(100)
        }
        const pendingError = this.methods.getPendingError()
        if (pendingError instanceof Error) {
            throw pendingError
        } else if (pendingError !== undefined) {
            this.exit(pendingError)
        }
    }
}
