import { PATH_SEPARATOR } from 'filesystem/constants'
import { Directory, type DirectoryDTO } from 'filesystem/directories/directory'


export class RootDirectory extends Directory {

    public constructor(dto: DirectoryDTO) {
        super(dto)
    }

    public override get absolutePath(): string {
        return PATH_SEPARATOR
    }
}
