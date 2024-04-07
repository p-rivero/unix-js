import { InternalError } from 'errors'
import { ProgramExit } from 'errors/process'
import type { ExecutionContext } from 'filesystem/execution-context'
import type { ExecutableMethods, SignalHandler } from 'filesystem/files/executable-types'
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

interface ProcessIds {
    readonly pid: number
    ppid: number
    pgid: number
}

export class Process {
    private readonly ids: ProcessIds
    private readonly file: File
    private readonly methods: ExecutableMethods
    public readonly executionContext: ExecutionContext
    private readonly proxy: ProcessProxy

    private readonly signalHandlers: Record<number, SignalHandler | undefined> = {}
    private readonly pendingSignalsQueue: Signal[] = []

    private started = false
    private stopped = false
    private exitResult: number | Error | undefined = undefined

    public constructor(table: ProcessTable, params: ProcessParams) {
        this.ids = {
            pid: params.pid,
            ppid: params.ppid,
            pgid: params.pgid
        }
        this.executionContext = params.context
        this.proxy = new ProcessProxy(this, table, params.context, {
            getPendingError: () => this.exitResult,
            isStopped: () => this.state === 'stopped'
        })
        this.file = params.file
        this.methods = params.file.getExecutable()
    }

    public get pid(): number {
        return this.ids.pid
    }
    public get pgid(): number {
        return this.ids.pgid
    }
    public set pgid(value: number) {
        this.ids.pgid = value
    }
    public get ppid(): number {
        return this.ids.ppid
    }
    public set ppid(value: number) {
        this.ids.ppid = value
    }

    public get state(): ProcessState {
        if (!this.started) {
            return 'spawn'
        }
        if (this.stopped) {
            return 'stopped'
        }
        if (this.exitResult === undefined) {
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
                this.exitResult = exitCode 
            })
            .catch(e => {
                if (e instanceof ProgramExit) {
                    this.exitResult = e.exitCode
                } else if (e instanceof Error) {
                    this.exitResult = e
                } else {
                    throw e
                }
            })
    }

    public async waitToFinish(): Promise<number> {
        if (this.state === 'spawn') {
            throw new InternalError('The process is not running')
        }
        while (this.state === 'running') {
            await sleep(20)
        }
        assert(this.exitResult !== undefined)

        if (this.exitResult instanceof Error) {
            throw this.exitResult
        }
        return this.exitResult
    }

    public registerSignalHandler(signal: Signal, handler: SignalHandler): void {
        this.signalHandlers[signal.number] = handler
    }
    
    public async sendSignal(signal: Signal): Promise<void> {
        if (this.state === 'spawn') {
            throw new InternalError('The process is not running')
        }
        if (this.state === 'zombie') {
            return
        }
        if (signal === Signal.SIGKILL) {
            this.exitResult = Signal.SIGKILL.exitCode
            this.stopped = false
            return
        }
        if (signal === Signal.SIGSTOP) {
            this.stopped = true
            return
        }
        if (this.state === 'stopped' && signal !== Signal.SIGCONT) {
            this.pendingSignalsQueue.push(signal)
            return
        }
        await this.runHandler(signal)
    }

    public stop(): void {
        this.stopped = true
    }
    public async resume(): Promise<void> {
        this.stopped = false
        for (const signal of this.pendingSignalsQueue) {
            await this.runHandler(signal)
        }
        this.pendingSignalsQueue.length = 0
    }

    private async runExecutable(args: readonly string[]): Promise<number> {
        const result = await this.methods.execute(this.proxy, [this.file.absolutePath, ...args])
        return result ?? 0
    }

    private async runHandler(signal: Signal): Promise<void> {
        const handler = this.signalHandlers[signal.number]
        try {
            if (handler) {
                await handler(this.proxy, signal)
            } else {
                await this.defaultSignalHandler(signal)
            }
        } catch (e) {
            if (e instanceof ProgramExit) {
                this.exitResult = e.exitCode
            } else {
                throw e
            }
        }
    }

    private async defaultSignalHandler(signal: Signal): Promise<void> {
        switch (signal.defaultAction) {
            case 'ignore':
                return
            case 'stop':
                this.stop()
                return
            case 'continue':
                await this.resume()
                return
            case 'terminate':
                this.proxy.exit(signal.exitCode)
        }
    }
}
