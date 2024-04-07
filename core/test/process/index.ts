/* eslint-disable @typescript-eslint/no-unnecessary-condition, no-constant-condition */
    
import { ExecutionContext } from 'filesystem/execution-context'
import { BinaryFile } from 'filesystem/files/binary-file'
import type { ExecutableGenerator, ExecutableMethods } from 'filesystem/files/executable-types'
import { sleep } from 'utils'

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

export async function infiniteLoop(): Promise<never> {
    while (true) {
        await sleep(100)
    }
}
