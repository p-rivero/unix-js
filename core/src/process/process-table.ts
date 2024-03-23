import { NoSuchProcess } from 'errors/process'
import { ExecutionContext } from 'filesystem/execution-context'
import type { File } from 'filesystem/files/file'
import { INIT_PID, initProcess } from 'process/init-process'
import { Process } from 'process/process'
import type { Signal } from 'process/signal'

export class ProcessTable {
    private readonly processes: Map<number, Process>
    private nextPid: number
  
    public constructor(initContext: ExecutionContext) {
        this.processes = new Map()
        this.processes.set(INIT_PID, initProcess(this, initContext))
        this.nextPid = INIT_PID + 1
    }
  
    public startProcess(parent: Process | null, file: File, args: readonly string[]): number {
        const processPid = this.nextPid++
        const parentOrInit = parent ?? this.getProcess(INIT_PID)
        const process = new Process(this, {
            pid: processPid,
            ppid: parentOrInit.pid,
            pgid: parentOrInit.pgid,
            context: new ExecutionContext(parentOrInit.executionContext),
            file
        })
        this.processes.set(processPid, process)
        process.start(args)
        return processPid
    }

    public async waitToFinish(pid: number): Promise<number> {
        const result = await this.getProcess(pid).waitToFinish()
        this.finalizeProcess(pid)
        return result
    }

    public async sendSignal(pid: number, signal: Signal): Promise<void> {
        await this.getProcess(pid).sendSignal(signal)
    }

    private getProcess(pid: number): Process {
        const init = this.processes.get(pid)
        if (init === undefined) {
            throw new NoSuchProcess()
        }
        return init
    }

    private finalizeProcess(killedProcessId: number): void {
        this.processes.delete(killedProcessId)
        for (const child of this.processes.values()) {
            if (child.ppid === killedProcessId) {
                child.ppid = INIT_PID
            }
        }
    }
}
