import { expect, test } from 'bun:test'
import { SIGINT } from 'processes/signal'

test('signal is initialized correctly', () => {
    expect(SIGINT.number).toBe(2)
    expect(SIGINT.name).toBe('SIGINT')
    expect(SIGINT.terminateByDefault).toBe(true)
    expect(SIGINT.exitCode).toBe(130)
})
