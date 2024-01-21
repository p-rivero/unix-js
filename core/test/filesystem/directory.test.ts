import assert from 'assert'
import { expect, test } from 'bun:test'
import { InvalidArgument, PermissionDenied } from 'errors'
import { NoSuchFileOrDirectory } from 'errors/filesystem'
import { Directory, type DirectoryDTO } from 'filesystem/directories/directory'
import { RootDirectory } from 'filesystem/directories/root-directory'

test('directory can list files', () => {
    const dto: DirectoryDTO = {
        name: 'test',
        type: 'directory',
        children: [
            {
                name: 'test1.txt',
                type: 'text-file',
                content: ''
            },
            {
                name: 'test2.txt',
                accessType: 'hidden',
                type: 'text-file',
                content: ''
            }
        ]
    }

    const dir = new RootDirectory(dto)
    expect(dir.getChildrenNames()).toEqual(['.', '..', 'test1.txt'])
    expect(dir.getChildrenNames(true)).toEqual(['.', '..', 'test1.txt', 'test2.txt'])
})

test('names of directory children must be unique', () => {
    let dto: DirectoryDTO = {
        name: 'test',
        type: 'directory',
        children: [
            {
                name: 'test1.txt',
                type: 'text-file',
                content: ''
            },
            {
                name: 'test1.txt',
                type: 'text-file',
                content: ''
            }
        ]
    }
    expect(() => new RootDirectory(dto)).toThrow(new InvalidArgument('Duplicate child name \'test1.txt\' in directory \'/\''))
})

test('can resolve path', () => {
    const dto: DirectoryDTO = {
        name: 'root-dir',
        type: 'directory',
        children: [
            {
                name: 'file1.txt',
                type: 'text-file',
                content: ''
            },
            {
                name: 'subdir',
                type: 'directory',
                children: [
                    {
                        name: 'file2.txt',
                        type: 'text-file',
                        content: ''
                    }
                ]
            }
        ]
    }
    const dir = new RootDirectory(dto)
    expect(dir.resolvePath(['.']).name).toEqual('root-dir')
    expect(dir.resolvePath(['.']).absolutePath).toEqual('/')

    expect(dir.resolvePath(['..']).name).toEqual('root-dir')
    expect(dir.resolvePath(['..']).absolutePath).toEqual('/')

    expect(dir.resolvePath(['subdir']).name).toEqual('subdir')
    expect(dir.resolvePath(['subdir']).absolutePath).toEqual('/subdir')
    
    expect(dir.resolvePath(['subdir', '..']).name).toEqual('root-dir')
    expect(dir.resolvePath(['subdir', '..']).absolutePath).toEqual('/')

    expect(dir.resolvePath(['subdir', 'file2.txt']).name).toEqual('file2.txt')
    expect(dir.resolvePath(['subdir', 'file2.txt']).absolutePath).toEqual('/subdir/file2.txt')

    expect(dir.resolvePath(['subdir', '.', '..', 'subdir', 'file2.txt']).name).toEqual('file2.txt')
    expect(dir.resolvePath(['subdir', '.', '..', 'subdir', 'file2.txt']).absolutePath).toEqual('/subdir/file2.txt')
})

test('user cannot access locked directory', () => {
    const dto: DirectoryDTO = {
        name: 'root-dir',
        type: 'directory',
        children: [
            {
                name: 'locked-dir',
                type: 'directory',
                accessType: 'locked',
                children: [
                    {
                        name: 'secret-file.txt',
                        type: 'text-file',
                        content: ''
                    }
                ]
            },
            {
                name: 'empty-locked-dir',
                type: 'directory',
                accessType: 'locked',
                children: []
            }
        ]
    }
    const dir = new RootDirectory(dto)
    expect(dir.getChildrenNames()).toEqual(['.', '..', 'empty-locked-dir', 'locked-dir'])
    const lockedDir = dir.getChild('locked-dir')
    assert(lockedDir instanceof Directory)

    expect(lockedDir.absolutePath).toEqual('/locked-dir')
    expect(() => lockedDir.getChildrenNames()).toThrow(new PermissionDenied())
    expect(lockedDir.getChildrenNames(true)).toEqual(['.', '..', 'secret-file.txt'])

    expect(() => lockedDir.resolvePath(['foo'])).toThrow(new PermissionDenied())
    expect(() => lockedDir.getChild('foo')).toThrow(new PermissionDenied())
    expect(() => dir.resolvePath(['locked-dir', 'foo'])).toThrow(new PermissionDenied())
    expect(() => dir.resolvePath(['locked-dir', 'secret-file.txt'])).toThrow(new PermissionDenied())
    expect(() => dir.resolvePath(['locked-dir', 'secret-file.txt'], true)).not.toThrow()

    expect(() => dir.resolvePath(['empty-locked-dir'])).not.toThrow()
    expect(() => dir.resolvePath(['empty-locked-dir', '.'])).toThrow(new PermissionDenied())
})

test('user cannot access hidden directories', () => {
    const dto: DirectoryDTO = {
        name: 'root-dir',
        type: 'directory',
        children: [
            {
                name: 'hidden-dir',
                type: 'directory',
                accessType: 'hidden',
                children: [
                    {
                        name: 'secret-file.txt',
                        type: 'text-file',
                        content: ''
                    }
                ]
            }
        ]
    }
    const dir = new RootDirectory(dto)
    expect(dir.getChildrenNames()).toEqual(['.', '..'])
    expect(() => dir.getChild('hidden-dir')).toThrow(new NoSuchFileOrDirectory())
    expect(() => dir.getChild('hidden-dir', true)).not.toThrow()
    expect(() => dir.resolvePath(['hidden-dir', 'secret-file.txt'])).toThrow(new NoSuchFileOrDirectory())
    expect(() => dir.resolvePath(['hidden-dir', 'secret-file.txt'], true)).not.toThrow()
})
