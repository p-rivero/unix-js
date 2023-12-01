import { InvalidArgument } from '@/errors/internal'
import type { DirectoryDTO } from '@/filesystem/directory'
import { RootDirectory } from '@/filesystem/root-directory'
import { expect, test } from 'bun:test'

test('directory can list files', () => {
    const dto: DirectoryDTO = {
        internalName: 'test',
        type: 'directory',
        children: [
            {
                internalName: 'test1.txt',
                displayName: 'test.txt',
                type: 'file',
                content: ''
            },
            {
                internalName: 'test2.txt',
                permissions: 'hidden',
                type: 'file',
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
                type: 'file',
                content: ''
            },
            {
                internalName: 'test1.txt',
                type: 'file',
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
                type: 'file',
                content: ''
            },
            {
                internalName: 'test2.txt',
                displayName: 'test.txt',
                type: 'file',
                content: ''
            }
        ]
    }
    expect(() => new RootDirectory(dto)).toThrow('Duplicate child display name \'test.txt\' in directory \'test\'')
})

test('directories cannot be executable', () => {
    const dto: DirectoryDTO = {
        internalName: 'test',
        type: 'directory',
        permissions: 'execute',
        children: []
    }
    expect(() => new RootDirectory(dto)).toThrow(new InvalidArgument('Directories cannot be executable'))
})

test('can resolve internal path', () => {
    const dto: DirectoryDTO = {
        internalName: 'root-dir',
        type: 'directory',
        children: [
            {
                internalName: 'file1.txt',
                type: 'file',
                content: ''
            },
            {
                internalName: 'subdir',
                type: 'directory',
                children: [
                    {
                        internalName: 'file2.txt',
                        type: 'file',
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
