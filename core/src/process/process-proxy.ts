import { ProgramExit } from 'errors/process'
import type { ExecutionContext } from 'filesystem/execution-context'
import type { File } from 'filesystem/files/file'
import type { Process } from 'process/process'
import type { ProcessPool } from 'process/process-pool'

type GetPendingError = () => number | undefined

export class ProcessProxy {
    private readonly process: Process
    private readonly pool: ProcessPool
    private readonly context: ExecutionContext
    private readonly getPendingError: GetPendingError

    public constructor(process: Process, pool: ProcessPool, context: ExecutionContext, getPendingError: GetPendingError) {
        this.process = process
        this.pool = pool
        this.context = context
        this.getPendingError = getPendingError
    }

    public get stdin(): File {
        this.checkInterrupted()
        return this.context.getFileStream(0)
    }
    public set stdin(file: File) {
        this.checkInterrupted()
        this.context.setFileStream(0, file)
    }

    public get stdout(): File {
        this.checkInterrupted()
        return this.context.getFileStream(1)
    }
    public set stdout(file: File) {
        this.checkInterrupted()
        this.context.setFileStream(1, file)
    }

    public get stderr(): File {
        this.checkInterrupted()
        return this.context.getFileStream(2)
    }
    public set stderr(file: File) {
        this.checkInterrupted()
        this.context.setFileStream(2, file)
    }

    public execute(file: File, args: string[], background: true): number
    public execute(file: File, args: string[], background: false): Promise<number>
    public execute(file: File, args: string[], background: boolean): number | Promise<number> {
        const pid = this.pool.startProcess(this.context, file, args)
        if (background) {
            return pid
        }
        return this.pool.waitToFinish(pid)
    }

    private checkInterrupted(): void {
        const pendingError = this.getPendingError()
        if (pendingError !== undefined) {
            throw new ProgramExit(pendingError)
        }
    }
}
