import assert from 'assert'
import { expect, test } from 'bun:test'
import { PermissionDenied } from 'errors'
import type { DirectoryDTO } from 'filesystem/directories/directory'
import { RootDirectory } from 'filesystem/directories/root-directory'
import { File, type FilePermission } from 'filesystem/files/file'
import type { AccessType } from 'filesystem/filesystem-node'

function getFile(textContent: string, accessType: AccessType = 'normal', permissions: FilePermission = 'read-write'): File {
    const dto: DirectoryDTO = {
        name: 'root-dir',
        type: 'directory',
        children: [
            {
                name: 'file.txt',
                type: 'text-file',
                accessType,
                permissions,
                content: textContent
            }
        ]
    }
    const file = new RootDirectory(dto).getChild('file.txt')
    assert(file instanceof File)
    return file
}

test('can read and write entire file without opening', async() => {
    const file = getFile('old text')
    expect(await file.read()).toEqual('old text')
    await file.write(' new text', true)
    expect(await file.read()).toEqual('old text new text')
    await file.write('Hello World')
    expect(await file.read()).toEqual('Hello World')
})

test('can open text file', async() => {
    const file = getFile('Hello world')
    const handle = file.open()
    expect(await handle.read(2)).toEqual('He')
    expect(handle.position).toEqual(2)
    expect(await handle.read(4)).toEqual('llo ')
    expect(handle.position).toEqual(6)
    await handle.write('AAA')
    expect(handle.position).toEqual(9)
    expect(await file.read()).toEqual('Hello AAAld')
    expect(await handle.read(9999)).toEqual('ld')
    expect(handle.position).toEqual(11)

    await handle.write('!')
    expect(handle.position).toEqual(12)
    expect(await file.read()).toEqual('Hello AAAld!')
})

test('2 handles on same file', async() => {
    const file = getFile('0123456789')
    const h1 = file.open()
    const h2 = file.open()
    expect(await h1.read(2)).toEqual('01')
    await h2.write('9876')
    expect(await file.read()).toEqual('9876456789')

    expect(await h1.read(6)).toEqual('764567')
    expect(await h2.read(6)).toEqual('456789')
})

test('truncate file with handle', async() => {
    const file = getFile('Hello World')
    const handle = file.open()
    handle.seek(5)
    await handle.write('!', false)
    expect(await file.read()).toEqual('Hello!World')
    await handle.write('!', true)
    expect(await file.read()).toEqual('Hello!!')
})

test('seek beyond end of file', async() => {
    const file = getFile('Hello World')
    const handle = file.open()
    handle.seek(999)
    expect(handle.position).toEqual(999)
    expect(await handle.read(1)).toEqual('')
    await handle.write(' :)')
    expect(await file.read()).toEqual('Hello World :)')
})

test('seek before start of file', async() => {
    const file = getFile('Hello World')
    const handle = file.open()
    handle.seek(-99)
    expect(handle.position).toEqual(0)
    expect(await handle.read(2)).toEqual('He')
})

test('cannot read or write locked file', () => {
    const file = getFile('Top Secret', 'locked')
    const handle = file.open()
    expect(handle.read(1)).rejects.toThrow(new PermissionDenied())
    expect(handle.write('foo')).rejects.toThrow(new PermissionDenied())
})

test('cannot write to readonly file', async() => {
    const file = getFile('Hello World', 'normal', 'read-only')
    const handle = file.open()
    expect(await handle.read(2)).toEqual('He')
    expect(handle.write('foo')).rejects.toThrow(new PermissionDenied())
})
