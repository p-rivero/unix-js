import assert from 'assert'
import { InternalError } from 'errors'
import { ProgramExit } from 'errors/process'
import type { ExecutionContext } from 'filesystem/execution-context'
import type { File } from 'filesystem/files/file'
import { ProcessProxy } from 'process/process-proxy'
import type { ProcessTable } from 'process/process-table'
import type { Signal } from 'process/signal'

export type ProcessState = 'spawn' | 'running' | 'zombie'

export class Process {
    public readonly pid: number
    private readonly file: File
    private readonly proxy: ProcessProxy
    private executionPromise: Promise<number> | undefined = undefined
    private exitCode: number | undefined = undefined
    private exception: Error | undefined = undefined

    public constructor(table: ProcessTable, pid: number, context: ExecutionContext, file: File) {
        this.pid = pid
        this.proxy = new ProcessProxy(this, table, context, () => this.exitCode)
        this.file = file
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
