import { InvalidArgument, PermissionDenied } from '@/errors'
import { NoSuchFileOrDirectory } from '@/errors/filesystem'
import type { DirectoryDTO } from '@/filesystem/directories/directory'
import { RootDirectory } from '@/filesystem/directories/root-directory'
import type { ExecutionContext } from '@/filesystem/execution-context'
import { BinaryFile } from '@/filesystem/files/binary-file'
import type { File } from '@/filesystem/files/file'
import { TextFile, type TextFileDTO } from '@/filesystem/files/text-file'
import assert from 'assert'
import { expect, mock, test } from 'bun:test'

const parent = new RootDirectory({
    internalName: 'test',
    type: 'directory',
    children: []
})

function mockContext(): ExecutionContext {
    function mockStream(): File {
        return {
            read: mock(() => ''),
            write: mock(() => '')
        } as unknown as File
    }
    return {
        stdin: mockStream(),
        stdout: mockStream(),
        stderr: mockStream()
    } as unknown as ExecutionContext
}

test('file must have valid name', () => {
    function makeFile(internalName: string, displayName?: string): TextFile {
        const dto: TextFileDTO = {
            internalName,
            displayName,
            type: 'text-file',
            content: ''
        }
        return new TextFile(dto, parent)
    }
    expect(() => makeFile('a/b')).toThrow(new InvalidArgument("Internal name 'a/b' cannot contain '/'"))
    expect(() => makeFile('')).toThrow(new InvalidArgument('Internal name cannot be empty'))
    expect(() => makeFile('name', '')).toThrow(new InvalidArgument('Display name cannot be empty'))
    expect(() => makeFile('.')).toThrow(new InvalidArgument('Internal name cannot be "." or ".."'))
    expect(() => makeFile('..')).toThrow(new InvalidArgument('Internal name cannot be "." or ".."'))
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
                permissions: 'read-write',
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
    expect(() => lockedFile.read()).toThrow(new PermissionDenied())
    expect(() => lockedFile.write('foo')).toThrow(new PermissionDenied())
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
                permissions: 'read-write',
                content: 'top secret'
            }
        ]
    }
    const dir = new RootDirectory(dto)
    expect(dir.displayChildrenNames).toEqual(['.', '..'])
    expect(() => dir.displayGetChild('hidden-file.txt')).toThrow(new NoSuchFileOrDirectory())
    expect(() => dir.internalGetChild('hidden-file.txt')).not.toThrow()
})

test('user cannot access locked binary file', () => {
    const dto: DirectoryDTO = {
        internalName: 'root-dir',
        type: 'directory',
        children: [
            {
                internalName: 'locked-file.txt',
                type: 'binary-file',
                accessType: 'locked',
                permissions: 'read-only',
                executable: () => 123 + 456
            }
        ]
    }
    const dir = new RootDirectory(dto)
    expect(dir.displayChildrenNames).toEqual(['.', '..', 'locked-file.txt'])
    const lockedFile = dir.displayGetChild('locked-file.txt')
    assert(lockedFile instanceof BinaryFile)

    expect(lockedFile.displayAbsolutePath).toEqual('/locked-file.txt')
    expect(lockedFile.readable).toEqual(false)
    expect(lockedFile.writable).toEqual(false)
    expect(() => lockedFile.read()).toThrow(new PermissionDenied())
    expect(() => lockedFile.write('foo')).toThrow(new PermissionDenied())
})

test('user cannot access hidden device file', () => {
    const dto: DirectoryDTO = {
        internalName: 'root-dir',
        type: 'directory',
        children: [
            {
                internalName: 'hidden-file.txt',
                type: 'device-file',
                accessType: 'hidden',
                permissions: 'read-write',
                onRead: () => 'top secret',
                onWrite: () => 0
            }
        ]
    }
    const dir = new RootDirectory(dto)
    expect(dir.displayChildrenNames).toEqual(['.', '..'])
    expect(() => dir.displayGetChild('hidden-file.txt')).toThrow(new NoSuchFileOrDirectory())
    expect(() => dir.internalGetChild('hidden-file.txt')).not.toThrow()
})

test('supports binary files', () => {
    const dto: DirectoryDTO = {
        internalName: 'root-dir',
        type: 'directory',
        children: [
            {
                internalName: 'bin-file',
                type: 'binary-file',
                permissions: 'read-only',
                executable: () => 123 + 456
            }
        ]
    }
    const file = new RootDirectory(dto).displayGetChild('bin-file')
    assert(file instanceof BinaryFile)
    expect(file.readable).toEqual(true)
    expect(file.writable).toEqual(false)
    expect(file.read()).toEqual('\n** Binary file **\n')
    expect(() => file.write('foo')).toThrow(new PermissionDenied())
})

test('binary files can be executable', () => {
    const dto: DirectoryDTO = {
        internalName: 'root-dir',
        type: 'directory',
        children: [
            {
                internalName: 'bin-file-internal',
                displayName: 'bin-file',
                type: 'binary-file',
                permissions: 'execute',
                executable: (streams, args) => {
                    expect(args).toEqual(['/bin-file', 'world'])
                    streams.stdout.write('Hello World')
                    return 123
                }
            }
        ]
    }
    const file = new RootDirectory(dto).displayGetChild('bin-file')
    assert(file instanceof BinaryFile)
    expect(file.read()).toEqual('\n** Binary file **\n')
    expect(() => file.write('foo')).toThrow(new PermissionDenied())

    const context = mockContext()
    expect(file.execute(context, ['world'])).toEqual(123)
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(context.stdout.write).toHaveBeenCalledTimes(1)
})
