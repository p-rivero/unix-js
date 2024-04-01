import { FileFlags, type FlagName } from 'parser/file-flags'
import { sep } from 'path'
import { PATH_SEPARATOR } from 'unix-core'

export class FileInfo {
    public readonly realPath: string
    public readonly name: string
    public readonly displayPath: string

    public constructor(parent: FileInfo | null, realPath: string, displayName: string | undefined) {
        this.realPath = realPath
        this.name = displayName ?? FileInfo.extractName(realPath)
        if (parent !== null) {
            this.displayPath = FileInfo.appendNameToPath(parent.displayPath, this.name)
        } else {
            this.displayPath = PATH_SEPARATOR
        }
    }

    public toString(): string {
        return `${this.realPath} [${this.displayPath}]`
    }

    private static extractName(path: string): string {
        const parts = path.split(sep)
        return parts[parts.length - 1]
    }

    public setFlagIfTrue(flagName: FlagName, value: boolean | undefined): void {
        if (value === true) {
            FileFlags.get(flagName).addPath(this.displayPath)
        }
    }

    private static appendNameToPath(path: string, name: string): string {
        if (path === PATH_SEPARATOR) {
            return PATH_SEPARATOR + name
        }
        return path + PATH_SEPARATOR + name
    }
}
