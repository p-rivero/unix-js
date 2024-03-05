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
  
    public constructor(executionContext: ExecutionContext, file: File) {
        this.executionContext = executionContext
        this.file = file
    }
  
    public start(args: string[]): void {
        if (this.executionPromise !== undefined) {
            throw new InternalError('The process is already running')
        }
        this.executionPromise = this.file.execute(this.executionContext, args)
    }

    public async waitToFinish(): Promise<number> {
        if (this.executionPromise === undefined) {
            throw new InternalError('The process is not running')
        }
        try {
            this.executionPromise.then((exitCode) => this.exitCode = exitCode)
            while (this.exitCode === undefined) {
                await new Promise((resolve) => setTimeout(resolve, 50))
            }
            return this.exitCode
        } catch (e) {
            if (e instanceof ProgramExit) {
                return e.exitCode
            }
            throw e
        }
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
