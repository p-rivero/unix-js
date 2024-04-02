import type { Directory } from 'filesystem/directories/directory'
import type { ExecutableMethods } from 'filesystem/files/executable-types'
import { File, type FileDTO, type ImplementReadSignature, type ImplementWriteSignature } from 'filesystem/files/file'

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

    public override implementRead: ImplementReadSignature = async range => {
        if (range) {
            return Promise.resolve(this.content.slice(range[0], range[1]))
        }
        return Promise.resolve(this.content)
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public override implementWrite: ImplementWriteSignature = async(content, position, truncate) => {
        const APPEND_TO_END_POSITION = this.content.length
        const contentStart = position ?? APPEND_TO_END_POSITION
        const contentEnd = contentStart + content.length
        if (truncate) {
            this.content = this.content.slice(0, contentStart) + content
        } else {
            this.content = this.content.slice(0, contentStart) + content + this.content.slice(contentEnd)
        }
    }

    public override implementGetExecutable(): ExecutableMethods {
        return {
            execute: async process => {
                await process.stdout.write(this.content)
            }
        }
    }
}
