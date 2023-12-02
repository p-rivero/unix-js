import { PermissionDenied } from '@/errors'
import type { Directory } from '@/filesystem/directories/directory'
import { File, type FileDTO } from '@/filesystem/files/file'
import type { IOStreams } from '@/input-output/io-stream'

export interface DeviceFileDTO extends FileDTO {
    readonly type: 'device-file'
    readonly permissions?: 'read-only' | 'read-write'
    readonly onRead: () => string
    readonly onWrite: (content: string) => void
}

export class DeviceFile extends File {
    private readonly onRead: () => string
    private readonly onWrite: (content: string) => void

    public constructor(dto: DeviceFileDTO, parent: Directory) {
        super(dto, parent)
        this.onRead = dto.onRead
        this.onWrite = dto.onWrite
    }

    public override implementRead(): string {
        return this.onRead()
    }

    public override implementWrite(content: string): void {
        this.onWrite(content)
    }

    public override implementExecute(_streams: IOStreams): number {
        throw new PermissionDenied()
    }
}
