import { InternalError } from 'errors'
import { ProgramExit } from 'errors/process'
import type { ExecutionContext } from 'filesystem/execution-context'
import type { File } from 'filesystem/files/file'
import { ProcessProxy } from 'processes/process-proxy'
import type { ProcessTable } from 'processes/process-table'
import { SIGKILL, type Signal } from 'processes/signal'
import { assert } from 'utils'

export type ProcessState = 'spawn' | 'running' | 'zombie'

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
    public readonly executionContext: ExecutionContext
    private readonly proxy: ProcessProxy
    private executionPromise: Promise<number> | undefined = undefined
    private exitCode: number | undefined = undefined
    private exception: Error | undefined = undefined
    private processGroup: number
    private parentPid: number

    public constructor(table: ProcessTable, params: ProcessParams) {
        this.pid = params.pid
        this.parentPid = params.ppid
        this.processGroup = params.pgid
        this.executionContext = params.context
        this.proxy = new ProcessProxy(this, table, params.context, () => this.exitCode)
        this.file = params.file
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
        if (this.executionPromise === undefined) {
            return 'spawn'
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
        this.executionPromise = this.file.execute(this.proxy, args)

        this.executionPromise
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
            await new Promise((resolve) => {
                setTimeout(resolve, 20) 
            })
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
        if (signal === SIGKILL) {
            this.exitCode = SIGKILL.exitCode
            return
        }
        try {
            await this.file.handleSignal(this.proxy, signal)
        } catch (e) {
            if (e instanceof ProgramExit) {
                this.exitCode = e.exitCode
                return
            }
            throw e
        }
    }

}
