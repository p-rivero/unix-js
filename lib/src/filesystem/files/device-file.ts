import { PermissionDenied } from 'errors'
import type { Directory } from 'filesystem/directories/directory'
import type { ExecutionContext } from 'filesystem/execution-context'
import { File, type FileDTO } from 'filesystem/files/file'

export interface DeviceFileDTO extends FileDTO {
    readonly type: 'device-file'
    readonly permissions?: 'read-only' | 'read-write'
    readonly onRead?: () => string
    readonly onWrite?: (content: string) => void
}

export class DeviceFile extends File {
    private readonly onRead: () => string
    private readonly onWrite: (content: string) => void

    public constructor(dto: DeviceFileDTO, parent: Directory) {
        function permissionDenied(): string {
            throw new PermissionDenied()
        }
        super(dto, parent)
        this.onRead = dto.onRead ?? permissionDenied
        this.onWrite = dto.onWrite ?? permissionDenied
    }

    public override implementRead(): string {
        return this.onRead()
    }

    public override implementWrite(content: string): void {
        this.onWrite(content)
    }

    public override implementExecute(_context: ExecutionContext, _args: string[]): number {
        throw new PermissionDenied()
    }
}
