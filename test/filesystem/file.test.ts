import { InvalidArgument } from '@/errors/internal'
import { File, type FileDTO } from '@/filesystem/file'
import { RootDirectory } from '@/filesystem/root-directory'
import { expect, test } from 'bun:test'

const parent = new RootDirectory({
    internalName: 'test',
    type: 'directory',
    children: []
})

test('file must have valid name', () => {
    let dto: FileDTO = {
        internalName: 'a/b',
        type: 'file',
        content: ''
    }
    expect(() => new File(dto, parent)).toThrow(new InvalidArgument("Internal name 'a/b' cannot contain '/'"))

    dto = {
        internalName: '',
        type: 'file',
        content: ''
    }
    expect(() => new File(dto, parent)).toThrow(new InvalidArgument('Internal name cannot be empty'))

    dto = {
        internalName: 'name',
        displayName: '',
        type: 'file',
        content: ''
    }
    expect(() => new File(dto, parent)).toThrow(new InvalidArgument('Display name cannot be empty'))

    dto = {
        internalName: '.',
        type: 'file',
        content: ''
    }
    expect(() => new File(dto, parent)).toThrow(new InvalidArgument('Internal name cannot be "." or ".."'))

    dto = {
        internalName: '..',
        type: 'file',
        content: ''
    }
    expect(() => new File(dto, parent)).toThrow(new InvalidArgument('Internal name cannot be "." or ".."'))
})
