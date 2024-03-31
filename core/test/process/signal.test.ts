import { expect, test } from 'bun:test'
import { Signal } from 'processes/signal'

test('signal is initialized correctly', () => {
    expect(Signal.SIGINT.number).toBe(2)
    expect(Signal.SIGINT.name).toBe('SIGINT')
    expect(Signal.SIGINT.terminateByDefault).toBe(true)
    expect(Signal.SIGINT.exitCode).toBe(130)
})
