import assert from 'assert'
import { expect, mock, test } from 'bun:test'
import { InvalidArgument, PermissionDenied } from 'errors'
import { NoSuchFileOrDirectory } from 'errors/filesystem'
import type { DirectoryDTO } from 'filesystem/directories/directory'
import { RootDirectory } from 'filesystem/directories/root-directory'
import { BinaryFile } from 'filesystem/files/binary-file'
import { DeviceFile, type DeviceFileDTO } from 'filesystem/files/device-file'
import type { File } from 'filesystem/files/file'
import { TextFile, type TextFileDTO } from 'filesystem/files/text-file'
import type { ProcessProxy } from 'processes/process-proxy'

const parent = new RootDirectory({
    name: 'test',
    type: 'directory',
    children: []
})

function mockProcess(): ProcessProxy {
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
    } as unknown as ProcessProxy
}

test('file must have valid name', () => {
    function makeFile(name: string): TextFile {
        const dto: TextFileDTO = {
            name,
            type: 'text-file',
            content: ''
        }
        return new TextFile(dto, parent)
    }
    expect(() => makeFile('a/b')).toThrow(new InvalidArgument('File name "a/b" cannot contain \'/\''))
    expect(() => makeFile('')).toThrow(new InvalidArgument('File name cannot be empty'))
    expect(() => makeFile('.')).toThrow(new InvalidArgument('File name cannot be "." or ".."'))
    expect(() => makeFile('..')).toThrow(new InvalidArgument('File name cannot be "." or ".."'))
})

test('user cannot access locked file', () => {
    const dto: DirectoryDTO = {
        name: 'root-dir',
        type: 'directory',
        children: [
            {
                name: 'locked-file.txt',
                type: 'text-file',
                accessType: 'locked',
                permissions: 'read-write',
                content: 'top secret'
            }
        ]
    }
    const dir = new RootDirectory(dto)
    expect(dir.getChildrenNames()).toEqual(['.', '..', 'locked-file.txt'])
    const lockedFile = dir.getChild('locked-file.txt')
    assert(lockedFile instanceof TextFile)

    expect(lockedFile.absolutePath).toEqual('/locked-file.txt')
    expect(lockedFile.isReadable).toEqual(false)
    expect(lockedFile.writable).toEqual(false)
    expect(lockedFile.read()).rejects.toThrow(new PermissionDenied())
    expect(lockedFile.write('foo')).rejects.toThrow(new PermissionDenied())
})

test('user cannot access hidden file', () => {
    const dto: DirectoryDTO = {
        name: 'root-dir',
        type: 'directory',
        children: [
            {
                name: 'hidden-file.txt',
                type: 'text-file',
                accessType: 'hidden',
                permissions: 'read-write',
                content: 'top secret'
            }
        ]
    }
    const dir = new RootDirectory(dto)
    expect(dir.getChildrenNames()).toEqual(['.', '..'])
    expect(() => dir.getChild('hidden-file.txt')).toThrow(new NoSuchFileOrDirectory())
    expect(() => dir.getChild('hidden-file.txt', true)).not.toThrow()
})

test('user cannot access locked binary file', () => {
    const dto: DirectoryDTO = {
        name: 'root-dir',
        type: 'directory',
        children: [
            {
                name: 'locked-file.txt',
                type: 'binary-file',
                accessType: 'locked',
                permissions: 'read-only',
                generator: () => ({
                    execute: () => 123 + 456
                })
            }
        ]
    }
    const dir = new RootDirectory(dto)
    expect(dir.getChildrenNames()).toEqual(['.', '..', 'locked-file.txt'])
    const lockedFile = dir.getChild('locked-file.txt')
    assert(lockedFile instanceof BinaryFile)

    expect(lockedFile.absolutePath).toEqual('/locked-file.txt')
    expect(lockedFile.isReadable).toEqual(false)
    expect(lockedFile.writable).toEqual(false)
    expect(lockedFile.read()).rejects.toThrow(new PermissionDenied())
    expect(lockedFile.write('foo')).rejects.toThrow(new PermissionDenied())
})

test('user cannot access hidden device file', () => {
    const dto: DirectoryDTO = {
        name: 'root-dir',
        type: 'directory',
        children: [
            {
                name: 'hidden-file.txt',
                type: 'device-file',
                accessType: 'hidden',
                permissions: 'read-write',
                generator: () => ({
                    read: () => 'top secret',
                    write: () => { 
                        // do nothing
                    }
                })
            }
        ]
    }
    const dir = new RootDirectory(dto)
    expect(dir.getChildrenNames()).toEqual(['.', '..'])
    expect(() => dir.getChild('hidden-file.txt')).toThrow(new NoSuchFileOrDirectory())
    expect(() => dir.getChild('hidden-file.txt', true)).not.toThrow()
})

test('supports binary files', async() => {
    const dto: DirectoryDTO = {
        name: 'root-dir',
        type: 'directory',
        children: [
            {
                name: 'bin-file',
                type: 'binary-file',
                generator: () => ({
                    execute: () => 123 + 456
                })
            }
        ]
    }
    const file = new RootDirectory(dto).getChild('bin-file')
    assert(file instanceof BinaryFile)
    expect(file.isReadable).toEqual(true)
    expect(file.writable).toEqual(true)
    expect(await file.read()).toEqual('\n** Binary file **\n')
    expect(file.write('foo')).rejects.toThrow(new PermissionDenied())
})

test('binary files can be executable', async() => {
    const dto: DirectoryDTO = {
        name: 'root-dir',
        type: 'directory',
        children: [
            {
                name: 'bin-file',
                type: 'binary-file',
                permissions: 'execute',
                generator: () => ({
                    execute: async(streams, args) => {
                        expect(args).toEqual(['/bin-file', 'a', 'b'])
                        await streams.stdout.write('Hello World')
                        return 123
                    }
                })
            }
        ]
    }
    const file = new RootDirectory(dto).getChild('bin-file')
    assert(file instanceof BinaryFile)
    expect(await file.read()).toEqual('\n** Binary file **\n')
    expect(file.write('foo')).rejects.toThrow(new PermissionDenied())

    const process = mockProcess()
    expect(await file.execute(process, ['a', 'b'])).toEqual(123)
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(process.stdout.write).toHaveBeenCalledTimes(1)
})

test('readline from text file', async() => {
    const dto: TextFileDTO = {
        name: 'file.txt',
        type: 'text-file',
        content: 'line1\nline2\nline3'
    }
    const file = new TextFile(dto, parent)
    const handle = file.open()
    expect(await handle.readLine()).toEqual('line1')
    expect(await handle.readLine()).toEqual('line2')
    expect(await handle.readLine()).toEqual('line3')
    expect(await handle.readLine()).toEqual('')
})

test('readline from device file', async() => {
    const dto: DeviceFileDTO = {
        name: 'device-file',
        type: 'device-file',
        generator: () => {
            let readCount = 0
            const returnValues = ['l', 'i', 'n', 'e', '1', '\n', 'line', '2', '\n', 'l', 'i', 'n', 'e', '3']
            return {
                read: () => returnValues[readCount++] ?? ''
            }
        }
    }
    const file = new DeviceFile(dto, parent)
    const handle = file.open()
    expect(await handle.readLine()).toEqual('line1')
    expect(await handle.readLine()).toEqual('line2')
    expect(await handle.readLine()).toEqual('line3')
    expect(await handle.readLine()).toEqual('')
})
