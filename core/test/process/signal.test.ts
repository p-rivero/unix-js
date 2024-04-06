/* eslint-disable no-await-in-loop, @typescript-eslint/no-unnecessary-condition, no-unmodified-loop-condition */

import { expect, test } from 'bun:test'
import { ProcessTable } from 'processes/process-table'
import { Signal } from 'processes/signal'
import { sleep } from 'utils'
import { createBinary, getContext, infiniteLoop } from '.'

test('signal is initialized correctly', () => {
    expect(Signal.SIGINT.number).toBe(2)
    expect(Signal.SIGINT.name).toBe('SIGINT')
    expect(Signal.SIGINT.defaultAction).toBe('terminate')
    expect(Signal.SIGINT.exitCode).toBe(130)

    expect(Signal.SIGCHLD.defaultAction).toBe('ignore')
    expect(Signal.SIGSTOP.defaultAction).toBe('stop')
    expect(Signal.SIGCONT.defaultAction).toBe('continue')
})

test('can interrupt a looping process', async() => {
    const context = getContext()
    const table = new ProcessTable(context)
    const loopForever = createBinary(context, {
        execute: async() => infiniteLoop()
    })
    const pid = table.startProcess(null, loopForever, [])
    await table.sendSignal(pid, Signal.SIGINT)
    const result = await table.waitToFinish(pid)
    expect(result).toBe(130)

    const withSignalHandler = createBinary(context, {
        execute: async(p) => {
            p.registerSignalHandler(Signal.SIGINT, (process, signal) => {
                expect(signal.name).toBe('SIGINT')
                process.exit(12)
            })
            await infiniteLoop()
        }
    })
    const pid2 = table.startProcess(null, withSignalHandler, [])
    await table.sendSignal(pid2, Signal.SIGINT)
    const result2 = await table.waitToFinish(pid2)
    expect(result2).toBe(12)
})

test('zombie processes never execute signal handlers', async() => {
    const context = getContext()
    const table = new ProcessTable(context)
    let done = false
    const bin = createBinary(context, {
        execute: async(p) => {
            p.registerSignalHandler(Signal.SIGINT, () => {
                throw new Error('should not be called')
            })
            await sleep(10)
            done = true
        }
    })
    const pid = table.startProcess(null, bin, [])
    expect(async() => table.sendSignal(pid, Signal.SIGINT)).toThrow(new Error('should not be called'))
    expect(async() => table.sendSignal(pid, Signal.SIGINT)).toThrow(new Error('should not be called'))
    while (!done) {
        await sleep(1)
    }
    expect(async() => table.sendSignal(pid, Signal.SIGINT)).not.toThrow()
})
