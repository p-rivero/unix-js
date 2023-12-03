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

    public override implementRead(): string {
        return this.content
    }

    public override implementWrite(content: string): void {
        this.content += content
    }

    public override implementExecute(context: ExecutionContext, _args: string[]): number {
        context.stdout.write(this.content)
        return 0
    }
}
