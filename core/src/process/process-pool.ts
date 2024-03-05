import { NoSuchProcess } from 'errors/process'
import type { ExecutionContext } from 'filesystem/execution-context'
import type { File } from 'filesystem/files/file'
import { Process } from 'process/process'
import type { Signal } from 'process/signal'

export class ProcessPool {
    private readonly processes: Map<number, Process>
    private nextPid: number
  
    public constructor() {
        this.processes = new Map()
        this.nextPid = 1
    }
  
    public startProcess(executionContext: ExecutionContext, file: File, args: string[]): number {
        const process = new Process(executionContext, file)
        this.processes.set(this.nextPid, process)
        process.start(args)
        return this.nextPid++
    }

    public async waitToFinish(pid: number): Promise<number> {
        const process = this.processes.get(pid)
        if (process === undefined) {
            throw new NoSuchProcess()
        }
        return process.waitToFinish()
    }

    public async sendSignal(pid: number, signal: Signal): Promise<void> {
        const process = this.processes.get(pid)
        if (process === undefined) {
            throw new NoSuchProcess()
        }
        await process.sendSignal(signal)
    }

}
