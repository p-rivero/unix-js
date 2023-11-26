import { assertUnique } from '@/utils/assert'
import { File, type FileDTO } from './file'
import { FilesystemNode, type FilesystemNodeDTO } from './filesystem-node'

export interface DirectoryDTO extends FilesystemNodeDTO {
    readonly type: 'directory';
    readonly children: readonly (DirectoryDTO | FileDTO)[];
}

export class Directory extends FilesystemNode {
    public readonly children: FilesystemNode[]

    public constructor(dto: DirectoryDTO, parent?: Directory) {
        super(dto, parent)
        if (dto.permissions === 'execute') {
            throw new Error('Directories cannot be executable')
        }
        this.children = dto.children.map((child) => {
            switch (child.type) {
                case 'directory':
                    return new Directory(child, this)
                case 'file':
                    return new File(child, this)
                default:
                    throw new Error('Unknown node type')
            }
        })
        assertUnique(this.children, 'internalName', (value) => {
            throw new Error(`Duplicate child internal name '${value}' in directory '${this.internalName}'`)
        })
        assertUnique(this.children, 'displayName', (value) => {
            throw new Error(`Duplicate child display name '${value}' in directory '${this.internalName}'`)
        })
    }

    public get childrenInternalNames(): string[] {
        return this.children.map(child => child.internalName)
    }
    
    public get childrenDisplayNames(): string[] {
        return this.children.filter(child => child.visible).map(child => child.displayName)
    }
}
