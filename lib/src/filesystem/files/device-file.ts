import { PermissionDenied } from 'errors'
import type { Directory } from 'filesystem/directories/directory'
import type { ExecutionContext } from 'filesystem/execution-context'
import { File, type FileDTO } from 'filesystem/files/file'

export interface DeviceFileMethods {
    read?: () => string
    write?: (content: string) => void
}

export interface DeviceFileDTO extends FileDTO {
    readonly type: 'device-file'
    readonly permissions?: 'read-only' | 'read-write'
    readonly generator: () => DeviceFileMethods
}

export class DeviceFile extends File {
    private readonly onRead: () => string
    private readonly onWrite: (content: string) => void

    public constructor(dto: DeviceFileDTO, parent: Directory) {
        function permissionDenied(): string {
            throw new PermissionDenied()
        }
        super(dto, parent)
        const methods = dto.generator()
        this.onRead = methods.read ?? permissionDenied
        this.onWrite = methods.write ?? permissionDenied
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
