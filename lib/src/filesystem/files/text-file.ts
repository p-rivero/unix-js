import type { Directory } from 'filesystem/directories/directory'
import type { ExecutionContext } from 'filesystem/execution-context'
import { File, type FileDTO } from 'filesystem/files/file'

export interface TextFileDTO extends FileDTO {
    readonly type: 'text-file'
    readonly content: string
}

export class TextFile extends File {
    private content: string

    public constructor(dto: TextFileDTO, parent: Directory) {
        super(dto, parent)
        this.content = dto.content
    }

    public override async implementRead(): Promise<string> {
        return Promise.resolve(this.content)
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public override async implementWrite(content: string): Promise<void> {
        this.content += content
    }

    public override async implementExecute(context: ExecutionContext, _args: string[]): Promise<number> {
        await context.stdout.write(this.content)
        return 0
    }
}
