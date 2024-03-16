import type { Process } from 'unix-core'

let A = 'aaa'
export async function write(a: Process, args: string[]) {
    A += a
    await a.stderr.write('stderr')

    const B = 'bbb'
    function execute2() {
        const C = 'ccc'
        return A + B + C
    }
    return execute2() + execute3()
}

function execute3() {
    const D = 'ddd'
    console.log('execute3')
    return A + D
}

function read(a = 30): string {
    if (a === 0) {
        return 'b'
    }
    return `${read(a - 1)}a`
}
