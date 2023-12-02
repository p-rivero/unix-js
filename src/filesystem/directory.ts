import { InternalError, InvalidArgument, PermissionDenied } from '@/errors'
import { NoSuchFileOrDirectory, NotADirectory } from '@/errors/filesystem'
import { BinaryFile, type BinaryFileDTO } from '@/filesystem/binary-file'
import { PARENT_DIR, THIS_DIR } from '@/filesystem/constants'
import { assertUnique } from '@/utils/assert'
import { FilesystemNode, type FilesystemNodeDTO } from './filesystem-node'
import { TextFile, type TextFileDTO } from './text-file'


export interface DirectoryDTO extends FilesystemNodeDTO {
    readonly type: 'directory'
    readonly children: readonly (DirectoryDTO | TextFileDTO | BinaryFileDTO)[]
}

export class Directory extends FilesystemNode {
    public readonly children: FilesystemNode[]

    protected constructor(dto: DirectoryDTO, parent?: Directory) {
        super(dto, parent)
        this.children = dto.children.map((child) => {
            switch (child.type) {
                case 'directory':
                    return new Directory(child, this)
                case 'text-file':
                    return new TextFile(child, this)
                case 'binary-file':
                    return new BinaryFile(child, this)
                default:
                    throw new InternalError('Unknown node type')
            }
        })
        assertUnique(this.children, 'internalName', (value) => {
            throw new InvalidArgument(`Duplicate child internal name '${value}' in directory '${this.internalName}'`)
        })
        assertUnique(this.children, 'displayName', (value) => {
            throw new InvalidArgument(`Duplicate child display name '${value}' in directory '${this.internalName}'`)
        })
    }

    public get internalChildrenNames(): string[] {
        const names = this.children.map(child => child.internalName)
        return Directory.sortAndAddExtraChildren(names)
    }
    
    public get displayChildrenNames(): string[] {
        if (!this.readable) {
            throw new PermissionDenied()
        }
        const names = this.children.filter(child => child.visible).map(child => child.displayName)
        return Directory.sortAndAddExtraChildren(names)
    }

    private static sortAndAddExtraChildren(names: string[]): string[] {
        const allChildren = names.concat([THIS_DIR, PARENT_DIR])
        return allChildren.toSorted((a, b) => a.localeCompare(b))
    }

    public displayGetChild(displayName: string): FilesystemNode {
        return this.getChild(displayName, 'displayName')
    }

    public internalGetChild(internalName: string): FilesystemNode {
        return this.getChild(internalName, 'internalName')
    }

    public displayResolvePath(path: string[]): FilesystemNode {
        return this.resolvePath(path, 'displayName')
    }

    public internalResolvePath(path: string[]): FilesystemNode {
        return this.resolvePath(path, 'internalName')
    }

    private getChild(name: string, nameAttr: keyof(FilesystemNode)): FilesystemNode {
        if (nameAttr === 'displayName' && !this.readable) {
            throw new PermissionDenied()
        }
        switch (name) {
            case THIS_DIR:
                return this
            case PARENT_DIR:
                return this.parent
            default: {
                const child = this.children.find(c => c[nameAttr] === name)
                const childIsHidden = child?.accessType === 'hidden'
                const shouldHideChild = childIsHidden && nameAttr === 'displayName'
                if (child && !shouldHideChild) {
                    return child
                }
                throw new NoSuchFileOrDirectory()
            }
        }
    }

    private resolvePath(path: string[], nameAttr: keyof(FilesystemNode)): FilesystemNode {
        if (path.length === 0) {
            return this
        }
        const [childName, ...rest] = path
        const child = this.getChild(childName, nameAttr)
        if (child instanceof Directory) {
            return child.resolvePath(rest, nameAttr)
        } 
        if (rest.length > 0) {
            throw new NotADirectory()
        }
        return child
    }
}
