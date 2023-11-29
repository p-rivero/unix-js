import { InvalidArgument } from '@/errors/internal'
import { File, type FileDTO } from '@/filesystem/file'
import { expect, test } from 'bun:test'

test('file must have valid name', () => {
    let dto: FileDTO = {
        internalName: 'a/b',
        type: 'file',
        content: ''
    }
    expect(() => new File(dto)).toThrow(new InvalidArgument("Internal name 'a/b' cannot contain '/'"))

    dto = {
        internalName: '',
        type: 'file',
        content: ''
    }
    expect(() => new File(dto)).toThrow(new InvalidArgument('Internal name cannot be empty'))

    dto = {
        internalName: 'name',
        displayName: '',
        type: 'file',
        content: ''
    }
    expect(() => new File(dto)).toThrow(new InvalidArgument('Display name cannot be empty'))

    dto = {
        internalName: '.',
        type: 'file',
        content: ''
    }
    expect(() => new File(dto)).toThrow(new InvalidArgument('Internal name cannot be "." or ".."'))

    dto = {
        internalName: '..',
        type: 'file',
        content: ''
    }
    expect(() => new File(dto)).toThrow(new InvalidArgument('Internal name cannot be "." or ".."'))
})

test('root cannot be a file', () => {
    const dto: FileDTO = {
        internalName: 'file.txt',
        type: 'file',
        content: ''
    }
    expect(() => new File(dto)).toThrow(new InvalidArgument('The filesystem root must be a directory'))
})
