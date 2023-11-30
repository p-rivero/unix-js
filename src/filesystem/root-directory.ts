import { PATH_SEPARATOR } from '@/filesystem/constants'
import { Directory, type DirectoryDTO } from '@/filesystem/directory'
import type { FilesystemNode } from '@/filesystem/filesystem-node'


export class RootDirectory extends Directory {

    public constructor(dto: DirectoryDTO) {
        super(dto)
    }

    public override get absoluteDisplayPath(): string {
        return PATH_SEPARATOR
    }

    public override get absoluteInternalPath(): string {
        return PATH_SEPARATOR
    }

    protected override getAbsolutePath(_attribute: keyof FilesystemNode): string {
        return ''
    }
}
