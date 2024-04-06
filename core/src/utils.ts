export function assert(condition: boolean, message?: string): asserts condition {
    if (!condition) {
        throw new Error(message ?? 'Assertion failed')
    }
}

export async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}
