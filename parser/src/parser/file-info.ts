import { FileFlags, type FlagName } from 'parser/file-flags'
import { sep } from 'path'
import { PATH_SEPARATOR } from 'unix-core'

export class FileInfo {
    public readonly realPath: string
    public readonly internalPath: string
    public readonly displayPath: string

    public constructor(parent: FileInfo | null, realPath: string, displayName: string | undefined) {
        this.realPath = realPath
        if (parent !== null) {
            const internalName = FileInfo.extractName(realPath)
            this.internalPath = FileInfo.appendNameToPath(parent.internalPath, internalName)
            this.displayPath = FileInfo.appendNameToPath(parent.displayPath, displayName ?? internalName)
        } else {
            this.internalPath = PATH_SEPARATOR
            this.displayPath = PATH_SEPARATOR
        }
    }
    
    public get internalName(): string {
        return FileInfo.extractName(this.internalPath)
    }

    public toString(): string {
        return `${this.realPath} [${this.displayPath}]`
    }

    public static extractName(path: string): string {
        const parts = path.split(sep)
        return parts[parts.length - 1]
    }

    public setFlagIfTrue(flagName: FlagName, value: boolean | undefined): void {
        if (value === true) {
            FileFlags.get(flagName).addInternalPath(this.internalPath)
        }
    }

    private static appendNameToPath(path: string, name: string): string {
        if (path === PATH_SEPARATOR) {
            return PATH_SEPARATOR + name
        }
        return path + PATH_SEPARATOR + name
    }
}
