import { expect, test } from 'bun:test'
import { InvalidArgument, PermissionDenied } from 'errors'
import { NoSuchFileOrDirectory } from 'errors/filesystem'
import type { DirectoryDTO } from 'filesystem/directories/directory'
import { ExecutionContext } from 'filesystem/execution-context'

const FILESYSTEM_TREE: DirectoryDTO = {
    internalName: 'the-root',
    type: 'directory',
    children: [
        {
            internalName: 'home',
            displayName: 'displayHome',
            type: 'directory',
            children: [
                {
                    internalName: 'user',
                    type: 'directory',
                    children: [
                        {
                            internalName: 'test1.txt',
                            displayName: 'test.txt',
                            accessType: 'locked',
                            type: 'text-file',
                            content: ''
                        }
                    ]
                }
            ]
        }
    ]
}

test('can initialize ExecutionContext', () => {
    const context = new ExecutionContext(FILESYSTEM_TREE, '/home/user')
    expect(context.currentWorkingDirectory.internalAbsolutePath).toEqual('/home/user')
})

test('Home must be a valid directory', () => {
    expect(() => new ExecutionContext(FILESYSTEM_TREE, '/home/user2'))
        .toThrow(new InvalidArgument("The home path '/home/user2' must point to an existing directory"))
    
    expect(() => new ExecutionContext(FILESYSTEM_TREE, '/home/user/test1.txt'))
        .toThrow(new InvalidArgument("The home path '/home/user/test1.txt' must point to an existing directory"))

    expect(() => new ExecutionContext(FILESYSTEM_TREE, 'home/user'))
        .toThrow(new InvalidArgument('The home path must be absolute'))

    const context = new ExecutionContext(FILESYSTEM_TREE, '/home//')
    expect(context.currentWorkingDirectory.internalAbsolutePath).toEqual('/home')
})

test('can resolve simple paths', () => {
    const context = new ExecutionContext(FILESYSTEM_TREE, '/home/user')
    expect(context.internalResolvePath('test1.txt').displayAbsolutePath).toEqual('/displayHome/user/test.txt')
    expect(context.displayResolvePath('test.txt').internalAbsolutePath).toEqual('/home/user/test1.txt')
    expect(context.internalResolvePath('./test1.txt').readable).toEqual(false)
    expect(() => context.displayResolvePath('test1.txt')).toThrow(new NoSuchFileOrDirectory())
    expect(() => context.internalResolvePath('test.txt')).toThrow(new NoSuchFileOrDirectory())
})

test('can resolve complex paths', () => {
    const context = new ExecutionContext(FILESYSTEM_TREE, '/home/user')
    expect(context.internalResolvePath('/home/user/').displayAbsolutePath).toEqual('/displayHome/user')
    expect(context.internalResolvePath('../..').displayAbsolutePath).toEqual('/')
    expect(context.displayResolvePath('../..').internalAbsolutePath).toEqual('/')
    expect(context.displayResolvePath('/').displayName).toEqual('the-root')
    expect(context.internalResolvePath('~').internalAbsolutePath).toEqual('/home/user')
    expect(context.internalResolvePath('~///..').internalAbsolutePath).toEqual('/home')
    expect(context.internalResolvePath('~/test1.txt').internalAbsolutePath).toEqual('/home/user/test1.txt')
})

test('can change directory', () => {
    const context = new ExecutionContext(FILESYSTEM_TREE, '/home/user')
    expect(context.currentWorkingDirectory).toBe(context.homeDirectory)

    context.internalChangeDirectory('/home')
    expect(context.internalResolvePath('.').internalAbsolutePath).toEqual('/home')
    expect(context.currentWorkingDirectory).not.toBe(context.homeDirectory)
    expect(() => context.displayChangeDirectory('/home')).toThrow(new NoSuchFileOrDirectory())

    context.displayChangeDirectory('/displayHome/user')
    expect(context.internalResolvePath('.').internalAbsolutePath).toEqual('/home/user')

    context.displayChangeDirectory('.././..')
    expect(context.internalResolvePath('.').internalAbsolutePath).toEqual('/')
    expect(context.currentWorkingDirectory).toBe(context.rootDirectory)

    context.displayChangeDirectory('~')
    expect(context.internalResolvePath('.').internalAbsolutePath).toEqual('/home/user')
})

test('can create pipes', async() => {
    const context = new ExecutionContext(FILESYSTEM_TREE, '/')
    const [pipeIn, pipeOut] = context.createPipe()
    expect(context.rootDirectory.internalChildrenNames).toEqual(['.', '..', 'home'])

    await pipeIn.write('foo')
    expect(await pipeOut.read()).toBe('foo')

    await pipeIn.write('bar')
    await pipeIn.write('baz')
    expect(await pipeOut.read()).toBe('barbaz')
    expect(await pipeOut.read()).toBe('')

    expect(async() => pipeOut.write('foo')).toThrow(new PermissionDenied())
    expect(async() => pipeIn.read()).toThrow(new PermissionDenied())
})
