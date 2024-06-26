import { expect, test } from 'bun:test'
import type { ExecutableMethods } from 'filesystem/files/executable-types'
import { Signal } from 'index'
import type { ProcessProxy } from 'processes/process-proxy'
import { ProcessTable } from 'processes/process-table'
import { sleep } from 'utils'
import { createBinary, getContext } from '.'

function testBinCode(process: ProcessProxy): ExecutableMethods {
    let str = '1'
    return {
        execute: async(args) => {
            process.registerSignalHandler(Signal.SIGALRM, () => {
                str += '8'
            })
            str += args[1]
            while (str.length < 3) {
                await sleep(10)
            }
            str += '4'
            return Number(str)
        }
    }
}

test('main method and signal handler share memory', async() => {
    const context = getContext()
    const table = new ProcessTable(context)
    const bin = createBinary(context, testBinCode)
    const pid = table.startProcess(null, bin, ['9'])
    await sleep(10)
    await table.sendSignal(pid, Signal.SIGALRM)
    const result = await table.waitToFinish(pid)
    expect(result).toBe(1984)
})

test('each process has its own memory', async() => {
    const context = getContext()
    const table = new ProcessTable(context)
    const bin = createBinary(context, testBinCode)
    const pid1 = table.startProcess(null, bin, ['9'])
    const pid2 = table.startProcess(null, bin, ['2'])
    await sleep(10)
    await table.sendSignal(pid1, Signal.SIGALRM)
    await table.sendSignal(pid2, Signal.SIGALRM)
    const result1 = await table.waitToFinish(pid1)
    const result2 = await table.waitToFinish(pid2)
    expect(result1).toBe(1984)
    expect(result2).toBe(1284)
})
