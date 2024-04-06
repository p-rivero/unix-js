/* eslint-disable @typescript-eslint/naming-convention */

export type SignalDefaultAction = 'terminate' | 'ignore' | 'stop' | 'continue'

export class Signal {
    public readonly name: string
    public readonly number: number
    public readonly defaultAction: SignalDefaultAction

    private constructor(name: string, number: number, defaultAction: SignalDefaultAction) {
        this.name = name
        this.number = number
        this.defaultAction = defaultAction
    }

    public toString(): string {
        return this.name
    }

    public get exitCode(): number {
        return this.number + 128
    }    

    public static readonly SIGHUP = new Signal('SIGHUP', 1, 'terminate')
    public static readonly SIGINT = new Signal('SIGINT', 2, 'terminate')
    public static readonly SIGQUIT = new Signal('SIGQUIT', 3, 'terminate')
    public static readonly SIGILL = new Signal('SIGILL', 4, 'terminate')
    public static readonly SIGABRT = new Signal('SIGABRT', 6, 'terminate')
    public static readonly SIGFPE = new Signal('SIGFPE', 8, 'terminate')
    public static readonly SIGKILL = new Signal('SIGKILL', 9, 'terminate')
    public static readonly SIGUSR1 = new Signal('SIGUSR1', 10, 'terminate')
    public static readonly SIGSEGV = new Signal('SIGSEGV', 11, 'terminate')
    public static readonly SIGUSR2 = new Signal('SIGUSR2', 12, 'terminate')
    public static readonly SIGPIPE = new Signal('SIGPIPE', 13, 'terminate')
    public static readonly SIGALRM = new Signal('SIGALRM', 14, 'terminate')
    public static readonly SIGTERM = new Signal('SIGTERM', 15, 'terminate')
    public static readonly SIGCHLD = new Signal('SIGCHLD', 17, 'ignore')
    public static readonly SIGCONT = new Signal('SIGCONT', 18, 'continue')
    public static readonly SIGSTOP = new Signal('SIGSTOP', 19, 'stop')
    public static readonly SIGTSTP = new Signal('SIGTSTP', 20, 'stop')
    public static readonly SIGTTIN = new Signal('SIGTTIN', 21, 'stop')
    public static readonly SIGTTOU = new Signal('SIGTTOU', 22, 'stop')
    public static readonly SIGWINCH = new Signal('SIGWINCH', 28, 'ignore')
}
