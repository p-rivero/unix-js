import type { ProcessProxy } from 'processes/process-proxy'
import type { Signal } from 'processes/signal'

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- We want to allow user functions to return void
export type ExecutableRet = void | number | undefined

export interface ExecutableMethods {
    execute: (process: ProcessProxy, args: string[]) => ExecutableRet | Promise<ExecutableRet>
}

export type ExecutableGenerator = () => ExecutableMethods

export type SignalHandler = (process: ProcessProxy, signal: Signal) => void | Promise<void>
