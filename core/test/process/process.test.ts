import { expect, test } from 'bun:test'
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

async function infiniteLoop(): Promise<never> {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, no-constant-condition
    while (true) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
            setTimeout(resolve, 100) 
        })
    }
}

test('can execute simple binaries', async() => {
    const table = new ProcessTable()
    const context = getContext()
    const noOp = createBinary(context, {
        execute: (_process, args) => {
            expect(args).toEqual(['/someBinary'])
        }
    })
    const pid = table.startProcess(context, noOp, [])
    expect(pid).toBe(1)
    const result = await table.waitToFinish(pid)
    expect(result).toBe(0)

    const addArgs = createBinary(context, {
        execute: (_process, args) => args.slice(1).map(Number).reduce((a, b) => a + b)
    })
    const pid2 = table.startProcess(context, addArgs, ['1', '2', '3'])
    expect(pid2).toBe(2)
    const result2 = await table.waitToFinish(pid2)
    expect(result2).toBe(6)
    const result2Again = await table.waitToFinish(pid2)
    expect(result2Again).toBe(6)
})

test('process can write to stdout', async() => {
    const table = new ProcessTable()
    const context = getContext()
    const bin = createBinary(context, {
        execute: async(process, args) => {
            await process.stdout.write(`I got the args: ${args.join(' ')}`)
            process.exit(42)
        }
    })
    const pid = table.startProcess(context, bin, ['foo', 'bar'])
    const result = await table.waitToFinish(pid)
    expect(result).toBe(42)
    const stdout = await context.resolvePath('/StdoutFile').asFile().read()
    expect(stdout).toBe('I got the args: /someBinary foo bar')
})


test('can interrupt a looping process', async() => {
    const table = new ProcessTable()
    const context = getContext()
    const loopForever = createBinary(context, {
        execute: async() => infiniteLoop()
    })
    const pid = table.startProcess(context, loopForever, [])
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
    const pid2 = table.startProcess(context, withSignalHandler, [])
    await table.sendSignal(pid2, SIGINT)
    const result2 = await table.waitToFinish(pid2)
    expect(result2).toBe(12)
})
