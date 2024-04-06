import { expect, test } from 'bun:test'
import { NoSuchProcess } from 'errors/process'
import { ProcessTable } from 'processes/process-table'
import { sleep } from 'utils'
import { createBinary, getContext } from '.'

test('can execute simple binaries 1', async() => {
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

    const pid2 = table.startProcess(null, noOp, [])
    expect(pid2).toBe(3)
    const result2 = await table.waitToFinish(pid2)
    expect(result2).toBe(0)
})

test('can execute simple binaries 2', async() => {
    const context = getContext()
    const table = new ProcessTable(context)
    const addArgs = createBinary(context, {
        execute: (_process, args) => args.slice(1).map(Number).reduce((a, b) => a + b)
    })
    const pid = table.startProcess(null, addArgs, ['1', '2', '3'])
    expect(pid).toBe(2)
    const result = await table.waitToFinish(pid)
    expect(result).toBe(6)
    expect(table.waitToFinish(pid)).rejects.toThrow(new NoSuchProcess())
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
            await sleep(10)
            throw new Error('I failed')
        }
    })
    const pid = table.startProcess(null, bin, [])
    expect(table.waitToFinish(pid)).rejects.toThrow(new Error('I failed'))
})
