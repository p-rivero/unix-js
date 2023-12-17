export function assertUnique<T>(objects: readonly T[], key: keyof T, onDuplicate: (value: string) => void): void {
    const set = new Set()
    for (const object of objects) {
        const value: unknown = object[key]
        if (set.has(value)) {
            onDuplicate(value?.toString() ?? '[undefined]')
        }
        set.add(value)
    }
}
