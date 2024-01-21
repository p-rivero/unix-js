import { expect, test } from 'bun:test'
import { InvalidArgument, PermissionDenied } from 'errors'
import { NoSuchFileOrDirectory } from 'errors/filesystem'
import type { DirectoryDTO } from 'filesystem/directories/directory'
import { ExecutionContext } from 'filesystem/execution-context'

const FILESYSTEM_TREE: DirectoryDTO = {
    name: 'the-root',
    type: 'directory',
    children: [
        {
            name: 'home',
            type: 'directory',
            children: [
                {
                    name: 'user',
                    type: 'directory',
                    children: [
                        {
                            name: 'test.txt',
                            accessType: 'locked',
                            type: 'text-file',
                            content: ''
                        }
                    ]
                },
                {
                    name: 'hidden-user',
                    accessType: 'hidden',
                    type: 'directory',
                    children: []
                }
            ]
        }
    ]
}

test('can initialize ExecutionContext', () => {
    const context = new ExecutionContext(FILESYSTEM_TREE, '/home/user')
    expect(context.currentWorkingDirectory.absolutePath).toEqual('/home/user')
})

test('Home must be a valid directory', () => {
    expect(() => new ExecutionContext(FILESYSTEM_TREE, '/home/user2'))
        .toThrow(new InvalidArgument("The home path '/home/user2' must point to an existing directory"))
    
    expect(() => new ExecutionContext(FILESYSTEM_TREE, '/home/user/test1.txt'))
        .toThrow(new InvalidArgument("The home path '/home/user/test1.txt' must point to an existing directory"))

    expect(() => new ExecutionContext(FILESYSTEM_TREE, 'home/user'))
        .toThrow(new InvalidArgument('The home path must be absolute'))

    const context = new ExecutionContext(FILESYSTEM_TREE, '/home//')
    expect(context.currentWorkingDirectory.absolutePath).toEqual('/home')
})

test('can resolve simple paths', () => {
    const context = new ExecutionContext(FILESYSTEM_TREE, '/home/user')
    expect(context.resolvePath('test.txt').absolutePath).toEqual('/home/user/test.txt')
    expect(context.resolvePath('./test.txt').isReadable).toEqual(false)
    expect(() => context.resolvePath('test1.txt')).toThrow(new NoSuchFileOrDirectory())
})

test('can resolve complex paths', () => {
    const context = new ExecutionContext(FILESYSTEM_TREE, '/home/user')
    expect(context.resolvePath('/home/user/').absolutePath).toEqual('/home/user')
    expect(context.resolvePath('../..').absolutePath).toEqual('/')
    expect(context.resolvePath('/').name).toEqual('the-root')
    expect(context.resolvePath('~').absolutePath).toEqual('/home/user')
    expect(context.resolvePath('~///..').absolutePath).toEqual('/home')
    expect(context.resolvePath('~/test.txt').absolutePath).toEqual('/home/user/test.txt')
})

test('can resolve hidden paths', () => {
    const context = new ExecutionContext(FILESYSTEM_TREE, '/home/user')
    expect(() => context.resolvePath('/home/hidden-user/')).toThrow(new NoSuchFileOrDirectory())
    expect(() => context.resolvePath('/home/hidden-user/', true)).not.toThrow()
})

test('can change directory', () => {
    const context = new ExecutionContext(FILESYSTEM_TREE, '/home/user')
    expect(context.currentWorkingDirectory).toBe(context.homeDirectory)

    context.changeDirectory('/home')
    expect(context.resolvePath('.').absolutePath).toEqual('/home')
    expect(context.currentWorkingDirectory).not.toBe(context.homeDirectory)
    expect(() => context.changeDirectory('/home2')).toThrow(new NoSuchFileOrDirectory())

    context.changeDirectory('/home/user')
    expect(context.resolvePath('.').absolutePath).toEqual('/home/user')

    context.changeDirectory('.././..')
    expect(context.resolvePath('.').absolutePath).toEqual('/')
    expect(context.currentWorkingDirectory).toBe(context.rootDirectory)

    context.changeDirectory('~')
    expect(context.resolvePath('.').absolutePath).toEqual('/home/user')
})

test('can change directory to hidden paths', () => {
    const context = new ExecutionContext(FILESYSTEM_TREE, '/home/user')
    expect(() => context.changeDirectory('/home/hidden-user/')).toThrow(new NoSuchFileOrDirectory())
    expect(() => context.changeDirectory('/home/hidden-user/', true)).not.toThrow()
})

test('can create pipes', async() => {
    const context = new ExecutionContext(FILESYSTEM_TREE, '/')
    const [pipeIn, pipeOut] = context.createPipe()
    expect(context.rootDirectory.getChildrenNames(true)).toEqual(['.', '..', 'home'])

    await pipeIn.write('foo')
    expect(await pipeOut.read()).toBe('foo')

    await pipeIn.write('bar')
    await pipeIn.write('baz')
    expect(await pipeOut.read()).toBe('barbaz')
    expect(await pipeOut.read()).toBe('')

    expect(async() => pipeOut.write('foo')).toThrow(new PermissionDenied())
    expect(async() => pipeIn.read()).toThrow(new PermissionDenied())
})
