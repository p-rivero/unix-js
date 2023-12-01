import { FilesystemPath } from '@/filesystem/filesystem-path'
import { expect, test } from 'bun:test'

test('can parse path', () => {
    const path = new FilesystemPath('/home/user')
    expect(path.isAbsolute).toBe(true)
    expect(path.isRelativeToHome).toBe(false)
    expect(path.parts).toEqual(['home', 'user'])
})

test('can parse path with multiple separators', () => {
    const path = new FilesystemPath('///home//user2//')
    expect(path.isAbsolute).toBe(true)
    expect(path.isRelativeToHome).toBe(false)
    expect(path.parts).toEqual(['home', 'user2'])
})

test('can parse path with spaces', () => {
    const path = new FilesystemPath('  ~/home/user3 ')
    expect(path.isAbsolute).toBe(false)
    expect(path.isRelativeToHome).toBe(true)
    expect(path.parts).toEqual(['home', 'user3'])
})

test('complex path', () => {
    const path = new FilesystemPath('~home/a/.././2/user')
    expect(path.isAbsolute).toBe(false)
    expect(path.isRelativeToHome).toBe(false)
    expect(path.parts).toEqual(['~home', 'a', '..', '.', '2', 'user'])
})

test('empty path', () => {
    const path = new FilesystemPath('  ')
    expect(path.isAbsolute).toBe(false)
    expect(path.isRelativeToHome).toBe(false)
    expect(path.parts).toEqual([])
})
