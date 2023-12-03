import assert from 'assert'
import { expect, test } from 'bun:test'
import { InvalidArgument, PermissionDenied } from 'errors'
import { NoSuchFileOrDirectory } from 'errors/filesystem'
import { Directory, type DirectoryDTO } from 'filesystem/directories/directory'
import { RootDirectory } from 'filesystem/directories/root-directory'

test('directory can list files', () => {
    const dto: DirectoryDTO = {
        internalName: 'test',
        type: 'directory',
        children: [
            {
                internalName: 'test1.txt',
                displayName: 'test.txt',
                type: 'text-file',
                content: ''
            },
            {
                internalName: 'test2.txt',
                accessType: 'hidden',
                type: 'text-file',
                content: ''
            }
        ]
    }

    const dir = new RootDirectory(dto)
    expect(dir.internalChildrenNames).toEqual(['.', '..', 'test1.txt', 'test2.txt'])
    expect(dir.displayChildrenNames).toEqual(['.', '..', 'test.txt'])
})

test('names of directory children must be unique', () => {
    let dto: DirectoryDTO = {
        internalName: 'test',
        type: 'directory',
        children: [
            {
                internalName: 'test1.txt',
                type: 'text-file',
                content: ''
            },
            {
                internalName: 'test1.txt',
                type: 'text-file',
                content: ''
            }
        ]
    }
    expect(() => new RootDirectory(dto)).toThrow(new InvalidArgument('Duplicate child internal name \'test1.txt\' in directory \'test\''))

    dto = {
        internalName: 'test',
        type: 'directory',
        children: [
            {
                internalName: 'test1.txt',
                displayName: 'test.txt',
                type: 'text-file',
                content: ''
            },
            {
                internalName: 'test2.txt',
                displayName: 'test.txt',
                type: 'text-file',
                content: ''
            }
        ]
    }
    expect(() => new RootDirectory(dto)).toThrow('Duplicate child display name \'test.txt\' in directory \'test\'')
})

test('can resolve internal path', () => {
    const dto: DirectoryDTO = {
        internalName: 'root-dir',
        type: 'directory',
        children: [
            {
                internalName: 'file1.txt',
                type: 'text-file',
                content: ''
            },
            {
                internalName: 'subdir',
                type: 'directory',
                children: [
                    {
                        internalName: 'file2.txt',
                        type: 'text-file',
                        content: ''
                    }
                ]
            }
        ]
    }
    const dir = new RootDirectory(dto)
    expect(dir.internalResolvePath(['.']).internalName).toEqual('root-dir')
    expect(dir.internalResolvePath(['.']).internalAbsolutePath).toEqual('/')

    expect(dir.internalResolvePath(['..']).internalName).toEqual('root-dir')
    expect(dir.internalResolvePath(['..']).internalAbsolutePath).toEqual('/')

    expect(dir.internalResolvePath(['subdir']).internalName).toEqual('subdir')
    expect(dir.internalResolvePath(['subdir']).internalAbsolutePath).toEqual('/subdir')
    
    expect(dir.internalResolvePath(['subdir', '..']).internalName).toEqual('root-dir')
    expect(dir.internalResolvePath(['subdir', '..']).internalAbsolutePath).toEqual('/')

    expect(dir.internalResolvePath(['subdir', 'file2.txt']).internalName).toEqual('file2.txt')
    expect(dir.internalResolvePath(['subdir', 'file2.txt']).internalAbsolutePath).toEqual('/subdir/file2.txt')

    expect(dir.internalResolvePath(['subdir', '.', '..', 'subdir', 'file2.txt']).internalName).toEqual('file2.txt')
    expect(dir.internalResolvePath(['subdir', '.', '..', 'subdir', 'file2.txt']).internalAbsolutePath).toEqual('/subdir/file2.txt')
})

test('user cannot access locked directory', () => {
    const dto: DirectoryDTO = {
        internalName: 'root-dir',
        type: 'directory',
        children: [
            {
                internalName: 'locked-dir',
                type: 'directory',
                accessType: 'locked',
                children: [
                    {
                        internalName: 'secret-file.txt',
                        type: 'text-file',
                        content: ''
                    }
                ]
            },
            {
                internalName: 'empty-locked-dir',
                type: 'directory',
                accessType: 'locked',
                children: []
            }
        ]
    }
    const dir = new RootDirectory(dto)
    expect(dir.displayChildrenNames).toEqual(['.', '..', 'empty-locked-dir', 'locked-dir'])
    const lockedDir = dir.displayGetChild('locked-dir')
    assert(lockedDir instanceof Directory)

    expect(lockedDir.displayAbsolutePath).toEqual('/locked-dir')
    expect(() => lockedDir.displayChildrenNames).toThrow(new PermissionDenied())
    expect(lockedDir.internalChildrenNames).toEqual(['.', '..', 'secret-file.txt'])

    expect(() => lockedDir.displayResolvePath(['foo'])).toThrow(new PermissionDenied())
    expect(() => lockedDir.displayGetChild('foo')).toThrow(new PermissionDenied())
    expect(() => dir.displayResolvePath(['locked-dir', 'foo'])).toThrow(new PermissionDenied())
    expect(() => dir.displayResolvePath(['locked-dir', 'secret-file.txt'])).toThrow(new PermissionDenied())
    expect(() => dir.internalResolvePath(['locked-dir', 'secret-file.txt'])).not.toThrow()

    expect(() => dir.displayResolvePath(['empty-locked-dir'])).not.toThrow()
    expect(() => dir.displayResolvePath(['empty-locked-dir', '.'])).toThrow(new PermissionDenied())
})

test('user cannot access hidden directories', () => {
    const dto: DirectoryDTO = {
        internalName: 'root-dir',
        type: 'directory',
        children: [
            {
                internalName: 'hidden-dir',
                type: 'directory',
                accessType: 'hidden',
                children: [
                    {
                        internalName: 'secret-file.txt',
                        type: 'text-file',
                        content: ''
                    }
                ]
            }
        ]
    }
    const dir = new RootDirectory(dto)
    expect(dir.displayChildrenNames).toEqual(['.', '..'])
    expect(() => dir.displayGetChild('hidden-dir')).toThrow(new NoSuchFileOrDirectory())
    expect(() => dir.internalGetChild('hidden-dir')).not.toThrow()
    expect(() => dir.displayResolvePath(['hidden-dir', 'secret-file.txt'])).toThrow(new NoSuchFileOrDirectory())
    expect(() => dir.internalResolvePath(['hidden-dir', 'secret-file.txt'])).not.toThrow()
})
