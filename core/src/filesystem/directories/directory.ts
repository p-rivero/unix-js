import { InternalError, InvalidArgument, PermissionDenied } from 'errors'
import { NoSuchFileOrDirectory, NotADirectory } from 'errors/filesystem'
import { PARENT_DIR, THIS_DIR } from 'filesystem/constants'
import { BinaryFile, type BinaryFileDTO } from 'filesystem/files/binary-file'
import { DeviceFile, type DeviceFileDTO } from 'filesystem/files/device-file'
import { TextFile, type TextFileDTO } from 'filesystem/files/text-file'
import { FilesystemNode, type FilesystemNodeDTO } from 'filesystem/filesystem-node'

type FilesystemNodeChildDTO = DirectoryDTO | TextFileDTO | BinaryFileDTO | DeviceFileDTO

export interface DirectoryDTO extends FilesystemNodeDTO {
    readonly type: 'directory'
    readonly children: readonly FilesystemNodeChildDTO[]
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
                case 'device-file':
                    return new DeviceFile(child, this)
                default:
                    throw new InternalError('Unknown node type')
            }
        })
        this.assertChildNamesAreUnique()
    }

    public getChildrenNames(includeHidden = false): string[] {
        if (!this.isReadable && !includeHidden) {
            throw new PermissionDenied()
        }
        const visibleChildren = includeHidden ? this.children : this.children.filter(child => child.isVisible)
        const childrenNames = visibleChildren.map(child => child.name).concat([THIS_DIR, PARENT_DIR])
        return childrenNames.toSorted((a, b) => a.localeCompare(b))
    }

    public getChild(name: string, includeHidden = false): FilesystemNode {
        if (!this.isReadable && !includeHidden) {
            throw new PermissionDenied()
        }
        switch (name) {
            case THIS_DIR:
                return this
            case PARENT_DIR:
                return this.parent
            default: {
                const child = this.children.find(c => c.name === name)
                if (!child) {
                    throw new NoSuchFileOrDirectory()
                }
                if (child.accessType !== 'hidden' || includeHidden) {
                    return child
                }
                throw new NoSuchFileOrDirectory()
            }
        }
    }

    public resolvePath(path: string[], allowHidden = false): FilesystemNode {
        if (path.length === 0) {
            return this
        }
        const [childName, ...rest] = path
        const child = this.getChild(childName, allowHidden)
        if (child instanceof Directory) {
            return child.resolvePath(rest, allowHidden)
        } 
        if (rest.length > 0) {
            throw new NotADirectory()
        }
        return child
    }

    private assertChildNamesAreUnique(): void {
        const set = new Set()
        for (const child of this.children) {
            if (set.has(child.name)) {
                throw new InvalidArgument(`Duplicate child name '${child.name}' in directory '${this.absolutePath}'`)
            }
            set.add(child.name)
        }
    }
}
