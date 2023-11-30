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
    expect(dir.childrenInternalNames).toEqual(['.', '..', 'test1.txt', 'test2.txt'])
    expect(dir.childrenDisplayNames).toEqual(['.', '..', 'test.txt'])
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
    expect(dir.resolveInternalPath(['.']).internalName).toEqual('root-dir')
    expect(dir.resolveInternalPath(['.']).absoluteInternalPath).toEqual('/')

    expect(dir.resolveInternalPath(['..']).internalName).toEqual('root-dir')
    expect(dir.resolveInternalPath(['..']).absoluteInternalPath).toEqual('/')

    expect(dir.resolveInternalPath(['subdir']).internalName).toEqual('subdir')
    expect(dir.resolveInternalPath(['subdir']).absoluteInternalPath).toEqual('/subdir')
    
    expect(dir.resolveInternalPath(['subdir', '..']).internalName).toEqual('root-dir')
    expect(dir.resolveInternalPath(['subdir', '..']).absoluteInternalPath).toEqual('/')

    expect(dir.resolveInternalPath(['subdir', 'file2.txt']).internalName).toEqual('file2.txt')
    expect(dir.resolveInternalPath(['subdir', 'file2.txt']).absoluteInternalPath).toEqual('/subdir/file2.txt')

    expect(dir.resolveInternalPath(['subdir', '.', '..', 'subdir', 'file2.txt']).internalName).toEqual('file2.txt')
    expect(dir.resolveInternalPath(['subdir', '.', '..', 'subdir', 'file2.txt']).absoluteInternalPath).toEqual('/subdir/file2.txt')
})
