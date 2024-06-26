import { NoSuchProcess } from 'errors/process'
import { ExecutionContext } from 'filesystem/execution-context'
import type { File } from 'filesystem/files/file'
import { INIT_PID, initProcess } from 'processes/init-process'
import { Process, type ProcessState } from 'processes/process'
import type { Signal } from 'processes/signal'

export class ProcessTable {
    private readonly processes: Map<number, Process>
    private nextPid: number
    private foregroundProcessGroup = INIT_PID
  
    public constructor(initContext: ExecutionContext) {
        this.processes = new Map()
        const init = initProcess(this, initContext)
        this.processes.set(INIT_PID, init)
        this.nextPid = INIT_PID + 1
        init.start([])
    }

    public get foregroundPgid(): number {
        return this.foregroundProcessGroup
    }
    public set foregroundPgid(value: number) {
        this.foregroundProcessGroup = value
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

    public getState(pid: number): ProcessState {
        return this.getProcess(pid).state
    }

    public async waitToFinish(pid: number): Promise<number> {
        const result = await this.getProcess(pid).waitToFinish()
        this.deleteProcess(pid)
        return result
    }

    public async sendSignal(pid: number, signal: Signal): Promise<void> {
        await this.getProcess(pid).sendSignal(signal)
    }

    public async sendGroupSignal(pgid: number | null, signal: Signal): Promise<void> {
        const group = pgid ?? this.foregroundProcessGroup
        await Promise.all(this.getProcesses(p => p.pgid === group).map(async p => p.sendSignal(signal)))
    }

    public updateProcessGroup(pid: number, pgid: number): void {
        this.getProcess(pid).pgid = pgid
    }

    private deleteProcess(pid: number): void {
        this.processes.delete(pid)
        for (const child of this.getProcesses(p => p.ppid === pid)) {
            child.ppid = INIT_PID
        }
    }

    private getProcess(pid: number): Process {
        const init = this.processes.get(pid)
        if (init === undefined) {
            throw new NoSuchProcess()
        }
        return init
    }

    private getProcesses(predicate: (p: Process) => boolean): Process[] {
        return [...this.processes.values()].filter(predicate)
    }
}
