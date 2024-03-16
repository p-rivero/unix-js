import assert from 'assert'
import { InternalError } from 'errors'
import { ProgramExit } from 'errors/process'
import type { ExecutionContext } from 'filesystem/execution-context'
import type { File } from 'filesystem/files/file'
import type { Signal } from 'process/signal'

export class Process {
    private readonly file: File
    private readonly executionContext: ExecutionContext
    private executionPromise: Promise<number> | undefined = undefined
    private exitCode: number | undefined = undefined
    private exception: Error | undefined = undefined

    // We cannot abort executionPromise if sendSignal stops the process, but we can prevent it from making changes to the filesystem
    private readonly abortableContextProxyHandler: ProxyHandler<ExecutionContext> = {
        get: (target, prop, receiver) => {
            if (this.exitCode !== undefined) {
                throw new ProgramExit(this.exitCode)
            }
            return Reflect.get(target, prop, receiver) as unknown
        }
    }
  
    public constructor(executionContext: ExecutionContext, file: File) {
        this.executionContext = executionContext
        this.file = file
    }
  
    public start(args: string[]): void {
        if (this.executionPromise !== undefined) {
            throw new InternalError('The process is already running')
        }
        const abortableContext = new Proxy(this.executionContext, this.abortableContextProxyHandler)
        this.executionPromise = this.file.execute(abortableContext, args)

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
        if (this.executionPromise === undefined) {
            throw new InternalError('The process is not running')
        }
        while (this.exitCode === undefined && this.exception === undefined) {
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
        if (this.executionPromise === undefined) {
            throw new InternalError('The process is not running')
        }
        try {
            await this.file.handleSignal(this.executionContext, signal)
        } catch (e) {
            if (e instanceof ProgramExit) {
                this.exitCode = e.exitCode
                return
            }
            throw e
        }
    }

}
