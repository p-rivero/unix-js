/* eslint-disable @typescript-eslint/no-unnecessary-condition, no-unmodified-loop-condition */

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
        execute: infiniteLoop
    })
    const pid = table.startProcess(null, loopForever, [])
    expect(table.getState(pid)).toBe('running')
    await table.sendSignal(pid, Signal.SIGINT)
    expect(table.getState(pid)).toBe('zombie')
    const result = await table.waitToFinish(pid)
    expect(result).toBe(130)

    const withSignalHandler = createBinary(context, process => ({
        execute: async() => {
            process.registerSignalHandler(Signal.SIGINT, (signal) => {
                expect(signal.name).toBe('SIGINT')
                process.exit(12)
            })
            await infiniteLoop()
        }
    }))
    const pid2 = table.startProcess(null, withSignalHandler, [])
    await table.sendSignal(pid2, Signal.SIGINT)
    const result2 = await table.waitToFinish(pid2)
    expect(result2).toBe(12)
})

test('zombie processes never execute signal handlers', async() => {
    const context = getContext()
    const table = new ProcessTable(context)
    let done = false
    const bin = createBinary(context, process => ({
        execute: async() => {
            process.registerSignalHandler(Signal.SIGINT, () => {
                throw new Error('should not be called')
            })
            await sleep(10)
            done = true
        }
    }))
    const pid = table.startProcess(null, bin, [])
    expect(async() => table.sendSignal(pid, Signal.SIGINT)).toThrow(new Error('should not be called'))
    expect(async() => table.sendSignal(pid, Signal.SIGINT)).toThrow(new Error('should not be called'))
    while (!done) {
        await sleep(1)
    }
    expect(async() => table.sendSignal(pid, Signal.SIGINT)).not.toThrow()
})

test('can stop and resume a process', async() => {
    const context = getContext()
    const table = new ProcessTable(context)
    const bin = createBinary(context, process => ({
        execute: async() => {
            let done = false
            process.registerSignalHandler(Signal.SIGALRM, () => {
                done = true
            })
            while (!done) {
                await sleep(1)
            }
        }
    }))
    const pid = table.startProcess(null, bin, [])
    await table.sendSignal(pid, Signal.SIGSTOP)
    await table.sendSignal(pid, Signal.SIGALRM)
    await sleep(10)
    expect(table.getState(pid)).toBe('stopped')
    await table.sendSignal(pid, Signal.SIGCONT)
    await sleep(10)
    expect(table.getState(pid)).toBe('zombie')
})

test('can kill a stopped process', async() => {
    const context = getContext()
    const table = new ProcessTable(context)
    const bin = createBinary(context, {
        execute: infiniteLoop
    })
    const pid = table.startProcess(null, bin, [])
    await table.sendSignal(pid, Signal.SIGSTOP)
    expect(table.getState(pid)).toBe('stopped')
    await table.sendSignal(pid, Signal.SIGKILL)
    expect(table.getState(pid)).toBe('zombie')
})

test('interrupt handlers run when process is resumed', async() => {
    const context = getContext()
    const table = new ProcessTable(context)
    let calledHandler = false
    const bin = createBinary(context, process => ({
        execute: async() => {
            process.registerSignalHandler(Signal.SIGALRM, async() => {
                calledHandler = true
                // Deadlock if the handler runs before the process is resumed
                await process.stdout.write('handler called\n')
            })
            while (!calledHandler) {
                await sleep(1)
            }
        }
    }))
    const pid = table.startProcess(null, bin, [])
    await table.sendSignal(pid, Signal.SIGSTOP)
    await table.sendSignal(pid, Signal.SIGALRM)
    await sleep(10)
    expect(calledHandler).toBe(false)
    await table.sendSignal(pid, Signal.SIGCONT)
    await sleep(10)
    expect(calledHandler).toBe(true)
    expect(table.getState(pid)).toBe('zombie')
})
