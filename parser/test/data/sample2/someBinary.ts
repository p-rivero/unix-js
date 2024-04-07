import type { Process } from 'unix-core'
declare const process: Process

const STR = 'Got some args: '
export async function execute(args: string[]): Promise<void> {

    await process.stdout.write(STR + args.join(' '))
    await process.stdout.write('\n')
}
