/* eslint-disable no-await-in-loop, @typescript-eslint/no-unnecessary-condition, no-unmodified-loop-condition */

import { expect, test } from 'bun:test'
import { ProcessTable } from 'processes/process-table'
import { Signal } from 'processes/signal'
import { createBinary, getContext, infiniteLoop, wait } from '.'

test('signal is initialized correctly', () => {
    expect(Signal.SIGINT.number).toBe(2)
    expect(Signal.SIGINT.name).toBe('SIGINT')
    expect(Signal.SIGINT.terminateByDefault).toBe(true)
    expect(Signal.SIGINT.exitCode).toBe(130)
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
        execute: async() => infiniteLoop(),
        handleSignal: (process, signal) => {
            expect(signal.name).toBe('SIGINT')
            process.exit(12)
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
        execute: async() => {
            await wait(10)
            done = true
        },
        handleSignal: () => {
            throw new Error('should not be called')
        }
    })
    const pid = table.startProcess(null, bin, [])
    expect(async() => table.sendSignal(pid, Signal.SIGINT)).toThrow(new Error('should not be called'))
    expect(async() => table.sendSignal(pid, Signal.SIGINT)).toThrow(new Error('should not be called'))
    while (!done) {
        await wait(1)
    }
    expect(async() => table.sendSignal(pid, Signal.SIGINT)).not.toThrow()
})
