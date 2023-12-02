import { InvalidArgument } from '@/errors'
import { NoSuchFileOrDirectory } from '@/errors/filesystem'
import type { DirectoryDTO } from '@/filesystem/directory'
import { ExecutionContext, type ExecutionContextDTO } from '@/filesystem/execution-context'
import { expect, test } from 'bun:test'

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
    const dto: ExecutionContextDTO = {
        filesystemTree: FILESYSTEM_TREE,
        homePath: '/home/user'
    }
    const context = new ExecutionContext(dto)
    expect(context.currentWorkingDirectory.internalAbsolutePath).toEqual('/home/user')
})

test('Home must be a valid directory', () => {
    let dto: ExecutionContextDTO = {
        filesystemTree: FILESYSTEM_TREE,
        homePath: '/home/user2'
    }
    expect(() => new ExecutionContext(dto)).toThrow(new InvalidArgument("The home '/home/user2' does not exist"))
    
    dto = {
        filesystemTree: FILESYSTEM_TREE,
        homePath: '/home/user/test1.txt'
    }
    expect(() => new ExecutionContext(dto)).toThrow(new InvalidArgument('The home path must point to a directory'))

    dto = {
        filesystemTree: FILESYSTEM_TREE,
        homePath: 'home/user'
    }
    expect(() => new ExecutionContext(dto)).toThrow(new InvalidArgument('The home path must be absolute'))

    dto = {
        filesystemTree: FILESYSTEM_TREE,
        homePath: '/home//'
    }
    const context = new ExecutionContext(dto)
    expect(context.currentWorkingDirectory.internalAbsolutePath).toEqual('/home')
})

test('can resolve simple paths', () => {
    const dto: ExecutionContextDTO = {
        filesystemTree: FILESYSTEM_TREE,
        homePath: '/home/user'
    }
    const context = new ExecutionContext(dto)
    expect(context.internalResolvePath('test1.txt').displayAbsolutePath).toEqual('/displayHome/user/test.txt')
    expect(context.displayResolvePath('test.txt').internalAbsolutePath).toEqual('/home/user/test1.txt')
    expect(context.internalResolvePath('./test1.txt').readable).toEqual(false)
    expect(() => context.displayResolvePath('test1.txt')).toThrow(new NoSuchFileOrDirectory())
    expect(() => context.internalResolvePath('test.txt')).toThrow(new NoSuchFileOrDirectory())
})

test('can resolve complex paths', () => {
    const dto: ExecutionContextDTO = {
        filesystemTree: FILESYSTEM_TREE,
        homePath: '/home/user'
    }
    const context = new ExecutionContext(dto)
    expect(context.internalResolvePath('/home/user/').displayAbsolutePath).toEqual('/displayHome/user')
    expect(context.internalResolvePath('../..').displayAbsolutePath).toEqual('/')
    expect(context.displayResolvePath('../..').internalAbsolutePath).toEqual('/')
    expect(context.displayResolvePath('/').displayName).toEqual('the-root')
    expect(context.internalResolvePath('~').internalAbsolutePath).toEqual('/home/user')
    expect(context.internalResolvePath('~///..').internalAbsolutePath).toEqual('/home')
    expect(context.internalResolvePath('~/test1.txt').internalAbsolutePath).toEqual('/home/user/test1.txt')
})

test('can change directory', () => {
    const dto: ExecutionContextDTO = {
        filesystemTree: FILESYSTEM_TREE,
        homePath: '/home/user'
    }
    const context = new ExecutionContext(dto)
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
