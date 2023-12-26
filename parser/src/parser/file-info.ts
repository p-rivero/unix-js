import { sep } from 'path'

export class FileInfo {
    public readonly realPath: string
    public readonly internalPath: string
    public readonly displayPath: string

    public constructor(parent: FileInfo | null, realPath: string, displayName: string | undefined) {
        this.realPath = realPath
        if (parent !== null) {
            const internalName = FileInfo.extractName(realPath)
            this.internalPath = `${parent.internalPath}/${internalName}`
            this.displayPath = `${parent.displayPath}/${displayName ?? internalName}`
        } else {
            this.internalPath = ''
            this.displayPath = ''
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
}
