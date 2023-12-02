import { InvalidArgument, PermissionDenied } from '@/errors'
import { NoSuchFileOrDirectory } from '@/errors/filesystem'
import type { DirectoryDTO } from '@/filesystem/directory'
import { RootDirectory } from '@/filesystem/root-directory'
import { TextFile, type TextFileDTO } from '@/filesystem/text-file'
import assert from 'assert'
import { expect, test } from 'bun:test'

const parent = new RootDirectory({
    internalName: 'test',
    type: 'directory',
    children: []
})

test('file must have valid name', () => {
    function makeTextFile(internalName: string, displayName?: string): TextFile {
        const dto: TextFileDTO = {
            internalName,
            displayName,
            type: 'text-file',
            content: ''
        }
        return new TextFile(dto, parent)
    }
    expect(() => makeTextFile('a/b')).toThrow(new InvalidArgument("Internal name 'a/b' cannot contain '/'"))
    expect(() => makeTextFile('')).toThrow(new InvalidArgument('Internal name cannot be empty'))
    expect(() => makeTextFile('name', '')).toThrow(new InvalidArgument('Display name cannot be empty'))
    expect(() => makeTextFile('.')).toThrow(new InvalidArgument('Internal name cannot be "." or ".."'))
    expect(() => makeTextFile('..')).toThrow(new InvalidArgument('Internal name cannot be "." or ".."'))
})

test('user cannot access locked file', () => {
    const dto: DirectoryDTO = {
        internalName: 'root-dir',
        type: 'directory',
        children: [
            {
                internalName: 'locked-file.txt',
                type: 'text-file',
                accessType: 'locked',
                writable: true,
                content: 'top secret'
            }
        ]
    }
    const dir = new RootDirectory(dto)
    expect(dir.displayChildrenNames).toEqual(['.', '..', 'locked-file.txt'])
    const lockedFile = dir.displayGetChild('locked-file.txt')
    assert(lockedFile instanceof TextFile)

    expect(lockedFile.displayAbsolutePath).toEqual('/locked-file.txt')
    expect(lockedFile.readable).toEqual(false)
    expect(lockedFile.writable).toEqual(false)
    expect(() => lockedFile.displayRead()).toThrow(new PermissionDenied())
    expect(() => lockedFile.displayWrite('foo')).toThrow(new PermissionDenied())
    expect(() => lockedFile.internalRead()).not.toThrow()
    expect(() => lockedFile.internalWrite('foo')).not.toThrow()
})

test('user cannot access hidden file', () => {
    const dto: DirectoryDTO = {
        internalName: 'root-dir',
        type: 'directory',
        children: [
            {
                internalName: 'hidden-file.txt',
                type: 'text-file',
                accessType: 'hidden',
                writable: true,
                content: 'top secret'
            }
        ]
    }
    const dir = new RootDirectory(dto)
    expect(dir.displayChildrenNames).toEqual(['.', '..'])
    expect(() => dir.displayGetChild('hidden-file.txt')).toThrow(new NoSuchFileOrDirectory())
    expect(() => dir.internalGetChild('hidden-file.txt')).not.toThrow()
})
