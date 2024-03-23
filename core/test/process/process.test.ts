/* eslint-disable @typescript-eslint/no-unnecessary-condition, no-constant-condition,
    no-await-in-loop, no-unmodified-loop-condition */

import { expect, test } from 'bun:test'
import { NoSuchProcess } from 'errors/process'
import { ExecutionContext } from 'filesystem/execution-context'
import { BinaryFile, type BinaryFileMethods } from 'filesystem/files/binary-file'
import { ProcessTable } from 'process/process-table'
import { SIGINT } from 'process/signal'

function getContext(): ExecutionContext {
    const context = new ExecutionContext({
        name: 'test',
        type: 'directory',
        children: [{
            name: 'StdoutFile',
            type: 'text-file',
            content: ''
        }]
    }, '/')
    context.setFileStream(1, context.resolvePath('/StdoutFile').asFile())
    return context
}

function createBinary(context: ExecutionContext, methods: BinaryFileMethods): BinaryFile {
    const parent = context.resolvePath('/').asDirectory()
    return new BinaryFile({
        name: 'someBinary',
        type: 'binary-file',
        permissions: 'execute',
        generator: () => methods
    }, parent)
}

async function wait(time: number): Promise<void> {
    await new Promise((resolve) => {
        setTimeout(resolve, time) 
    })
}

async function infiniteLoop(): Promise<never> {
    while (true) {
        await wait(100)
    }
}

test('can execute simple binaries', async() => {
    const context = getContext()
    const table = new ProcessTable(context)
    const noOp = createBinary(context, {
        execute: (_process, args) => {
            expect(args).toEqual(['/someBinary'])
        }
    })
    const pid = table.startProcess(null, noOp, [])
    expect(pid).toBe(2)
    const result = await table.waitToFinish(pid)
    expect(result).toBe(0)

    const addArgs = createBinary(context, {
        execute: (_process, args) => args.slice(1).map(Number).reduce((a, b) => a + b)
    })
    const pid2 = table.startProcess(null, addArgs, ['1', '2', '3'])
    expect(pid2).toBe(3)
    const result2 = await table.waitToFinish(pid2)
    expect(result2).toBe(6)
    expect(table.waitToFinish(pid2)).rejects.toThrow(new NoSuchProcess())
})

test('process can write to stdout', async() => {
    const context = getContext()
    const table = new ProcessTable(context)
    const bin = createBinary(context, {
        execute: async(process, args) => {
            await process.stdout.write(`I got the args: ${args.join(' ')}`)
            process.exit(42)
        }
    })
    const pid = table.startProcess(null, bin, ['foo', 'bar'])
    const result = await table.waitToFinish(pid)
    expect(result).toBe(42)
    const stdout = await context.resolvePath('/StdoutFile').asFile().read()
    expect(stdout).toBe('I got the args: /someBinary foo bar')
})

test('thrown exceptions are re-raised to the parent', () => {
    const context = getContext()
    const table = new ProcessTable(context)
    const bin = createBinary(context, {
        execute: async() => {
            await wait(10)
            throw new Error('I failed')
        }
    })
    const pid = table.startProcess(null, bin, [])
    expect(table.waitToFinish(pid)).rejects.toThrow(new Error('I failed'))
})

test('can interrupt a looping process', async() => {
    const context = getContext()
    const table = new ProcessTable(context)
    const loopForever = createBinary(context, {
        execute: async() => infiniteLoop()
    })
    const pid = table.startProcess(null, loopForever, [])
    await table.sendSignal(pid, SIGINT)
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
    await table.sendSignal(pid2, SIGINT)
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
    expect(async() => table.sendSignal(pid, SIGINT)).toThrow(new Error('should not be called'))
    expect(async() => table.sendSignal(pid, SIGINT)).toThrow(new Error('should not be called'))
    while (!done) {
        await wait(1)
    }
    expect(async() => table.sendSignal(pid, SIGINT)).not.toThrow()
})
