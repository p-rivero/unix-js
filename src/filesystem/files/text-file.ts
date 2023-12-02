import type { Directory } from '@/filesystem/directories/directory'
import { File, type FileDTO } from '@/filesystem/files/file'
import type { IOStreams } from '@/input-output/io-stream'

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

    public override implementExecute(streams: IOStreams): number {
        streams.stdout.write(this.content)
        return 0
    }
}
