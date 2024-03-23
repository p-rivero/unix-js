import type { ExecutionContext } from 'filesystem/execution-context'
import { BinaryFile, type BinaryFileDTO } from 'filesystem/files/binary-file'
import { Process } from 'process/process'
import type { ProcessTable } from 'process/process-table'

export const INIT_PID = 1
export const INIT_PPID = 0

export function initProcess(table: ProcessTable, context: ExecutionContext): Process {
    const fileDto: BinaryFileDTO = {
        name: 'init',
        type: 'binary-file',
        permissions: 'execute',
        generator: () => ({
            execute: async() => {
                // TODO: React to SIGCHLD and finalize processes
            }
        })
    }

    return new Process(table, {
        pid: INIT_PID,
        ppid: INIT_PPID,
        pgid: INIT_PID,
        context,
        file: new BinaryFile(fileDto, context.rootDirectory)
    })
}
