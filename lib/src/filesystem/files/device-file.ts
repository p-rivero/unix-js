import { PermissionDenied } from 'errors'
import type { Directory } from 'filesystem/directories/directory'
import type { ExecutionContext } from 'filesystem/execution-context'
import { File, type FileDTO } from 'filesystem/files/file'

type ReadFn = () => string | Promise<string>
type WriteFn = (content: string) => void | Promise<void>

export interface DeviceFileMethods {
    read?: ReadFn
    write?: WriteFn
}

export interface DeviceFileDTO extends FileDTO {
    readonly type: 'device-file'
    readonly permissions?: 'read-only' | 'read-write'
    readonly generator: () => DeviceFileMethods
}

export class DeviceFile extends File {
    private readonly onRead: ReadFn
    private readonly onWrite: WriteFn

    public constructor(dto: DeviceFileDTO, parent: Directory) {
        function permissionDenied(): never {
            throw new PermissionDenied()
        }
        super(dto, parent)
        const methods = dto.generator()
        this.onRead = methods.read ?? permissionDenied
        this.onWrite = methods.write ?? permissionDenied
    }

    public override async implementRead(): Promise<string> {
        return this.onRead()
    }

    public override async implementWrite(content: string): Promise<void> {
        await this.onWrite(content)
    }

    public override implementExecute(_context: ExecutionContext, _args: string[]): never {
        throw new PermissionDenied()
    }
}
