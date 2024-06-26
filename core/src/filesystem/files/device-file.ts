import { PermissionDenied } from 'errors'
import type { Directory } from 'filesystem/directories/directory'
import type { ExecutableMethods } from 'filesystem/files/executable-types'
import { File, type FileDTO, type ImplementReadSignature, type ImplementWriteSignature } from 'filesystem/files/file'

type ReadFn = (numChars?: number) => string | Promise<string>
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

    public override implementRead: ImplementReadSignature = async(range) => {
        const numChars = range ? range[1] - range[0] : undefined
        return this.onRead(numChars)
    }

    public override implementWrite: ImplementWriteSignature = async content => this.onWrite(content)

    public override implementGetExecutable(): ExecutableMethods {
        throw new PermissionDenied()
    }
}
