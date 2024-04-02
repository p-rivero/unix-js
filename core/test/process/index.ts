/* eslint-disable @typescript-eslint/no-unnecessary-condition, no-constant-condition, no-await-in-loop */
    
import { ExecutionContext } from 'filesystem/execution-context'
import { BinaryFile } from 'filesystem/files/binary-file'
import type { ExecutableGenerator, ExecutableMethods } from 'filesystem/files/executable-types'

export function getContext(): ExecutionContext {
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

export function createBinary(context: ExecutionContext, methods: ExecutableMethods | ExecutableGenerator): BinaryFile {
    const parent = context.resolvePath('/').asDirectory()
    return new BinaryFile({
        name: 'someBinary',
        type: 'binary-file',
        permissions: 'execute',
        generator: typeof methods === 'function' ? methods : () => methods
    }, parent)
}

export async function wait(timeMs: number): Promise<void> {
    await new Promise((resolve) => {
        setTimeout(resolve, timeMs) 
    })
}

export async function infiniteLoop(): Promise<never> {
    while (true) {
        await wait(100)
    }
}
