import { Directory, type DirectoryDTO } from '@/filesystem/directory'
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

    const dir = new Directory(dto)
    expect(dir.childrenInternalNames).toEqual(['test1.txt', 'test2.txt'])
    expect(dir.childrenDisplayNames).toEqual(['test.txt'])
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
    expect(() => new Directory(dto)).toThrow('Duplicate child internal name \'test1.txt\' in directory \'test\'')

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
    expect(() => new Directory(dto)).toThrow('Duplicate child display name \'test.txt\' in directory \'test\'')
})
