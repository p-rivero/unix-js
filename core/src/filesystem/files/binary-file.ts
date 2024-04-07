import { PermissionDenied } from 'errors'
import { BINARY_FILE_REPRESENTATION } from 'filesystem/constants'
import type { Directory } from 'filesystem/directories/directory'
import type { ExecutableGenerator, ExecutableMethods } from 'filesystem/files/executable-types'
import { File, type FileDTO, type ImplementReadSignature, type ImplementWriteSignature } from 'filesystem/files/file'
import type { ProcessProxy } from 'processes/process-proxy'

export interface BinaryFileDTO extends FileDTO {
    readonly type: 'binary-file'
    readonly permissions?: 'read-only' | 'execute'
    readonly generator: ExecutableGenerator
}

export class BinaryFile extends File {
    private readonly generator: ExecutableGenerator

    public constructor(dto: BinaryFileDTO, parent: Directory) {
        super(dto, parent)
        this.generator = dto.generator
    }

    public override implementRead: ImplementReadSignature = async() => Promise.resolve(BINARY_FILE_REPRESENTATION)

    public override implementWrite: ImplementWriteSignature = () => {
        throw new PermissionDenied()
    }

    public override implementGetExecutable(process: ProcessProxy): ExecutableMethods {
        return this.generator(process)
    }
}
