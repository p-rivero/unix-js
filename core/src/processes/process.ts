import { InternalError } from 'errors'
import { ProgramExit } from 'errors/process'
import type { ExecutionContext } from 'filesystem/execution-context'
import type { ExecutableMethods } from 'filesystem/files/executable-types'
import type { File } from 'filesystem/files/file'
import { ProcessProxy } from 'processes/process-proxy'
import type { ProcessTable } from 'processes/process-table'
import { Signal } from 'processes/signal'
import { assert, sleep } from 'utils'

export type ProcessState = 'spawn' | 'running' | 'zombie' | 'stopped'

export interface ProcessParams {
    readonly pid: number
    readonly ppid: number
    readonly pgid: number
    readonly context: ExecutionContext
    readonly file: File
}

export class Process {
    public readonly pid: number
    private readonly file: File
    private readonly methods: ExecutableMethods
    public readonly executionContext: ExecutionContext
    private readonly proxy: ProcessProxy
    private started = false
    private stopped = false
    private exitCode: number | undefined = undefined
    private exception: Error | undefined = undefined
    private processGroup: number
    private parentPid: number

    public constructor(table: ProcessTable, params: ProcessParams) {
        this.pid = params.pid
        this.parentPid = params.ppid
        this.processGroup = params.pgid
        this.executionContext = params.context
        this.proxy = new ProcessProxy(this, table, params.context, {
            getPendingError: () => this.exitCode,
            isStopped: () => this.state === 'stopped'
        })
        this.file = params.file
        this.methods = params.file.getExecutable()
    }

    public get pgid(): number {
        return this.processGroup
    }
    public set pgid(value: number) {
        this.processGroup = value
    }
    public get ppid(): number {
        return this.parentPid
    }
    public set ppid(value: number) {
        this.parentPid = value
    }

    public get state(): ProcessState {
        if (!this.started) {
            return 'spawn'
        }
        if (this.stopped) {
            return 'stopped'
        }
        if (this.exitCode === undefined && this.exception === undefined) {
            return 'running'
        }
        return 'zombie'
    }
  
    public start(args: readonly string[]): void {
        if (this.state !== 'spawn') {
            throw new InternalError('The process is already running')
        }
        this.started = true

        this.runExecutable(args)
            .then(exitCode => {
                this.exitCode = exitCode 
            })
            .catch(e => {
                if (e instanceof ProgramExit) {
                    this.exitCode = e.exitCode
                } else {
                    this.exception = e as Error
                }
            })
    }

    public async waitToFinish(): Promise<number> {
        if (this.state === 'spawn') {
            throw new InternalError('The process is not running')
        }
        while (this.state === 'running') {
            // eslint-disable-next-line no-await-in-loop -- Busy waiting here is intentional
            await sleep(20)
        }

        if (this.exception !== undefined) {
            throw this.exception
        }
        assert(this.exitCode !== undefined)
        return this.exitCode
    }
    
    public async sendSignal(signal: Signal): Promise<void> {
        if (this.state === 'spawn') {
            throw new InternalError('The process is not running')
        }
        if (this.state === 'zombie') {
            return
        }
        if (signal === Signal.SIGKILL) {
            this.exitCode = Signal.SIGKILL.exitCode
            return
        }
        if (signal === Signal.SIGSTOP) {
            this.stopped = true
            return
        }
        try {
            await this.runHandler(signal)
        } catch (e) {
            if (e instanceof ProgramExit) {
                this.exitCode = e.exitCode
                return
            }
            throw e
        }
    }

    public stop(): void {
        this.stopped = true
    }
    public resume(): void {
        this.stopped = false
    }

    private async runExecutable(args: readonly string[]): Promise<number> {
        const result = await this.methods.execute(this.proxy, [this.file.absolutePath, ...args])
        return result ?? 0
    }

    private async runHandler(signal: Signal): Promise<void> {
        if (this.methods.handleSignal) {
            await this.methods.handleSignal(this.proxy, signal)
        } else {
            Process.defaultSignalHandler(this.proxy, signal)
        }
    }

    private static defaultSignalHandler(process: ProcessProxy, signal: Signal): void {
        switch (signal.defaultAction) {
            case 'ignore':
                return
            case 'stop':
                process.stop()
                return
            case 'continue':
                process.resume()
                return
            case 'terminate':
                process.exit(signal.exitCode)
        }
    }
}
