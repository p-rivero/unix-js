
export type FlagName = 'isHomeDir' | 'isCommandDir' | 'isStartupCommand' | 'isStdin' | 'isStdout' | 'isStderr'

export class FileFlags {
    private static readonly instances = new Map<FlagName, FileFlags>()
    private readonly name: string
    private readonly internalPaths: string[] = []

    public static get(name: FlagName): FileFlags {
        const fileTag = FileFlags.instances.get(name)
        if (fileTag) {
            return fileTag
        }
        const newFileTag = new FileFlags(name)
        FileFlags.instances.set(name, newFileTag)
        return newFileTag
    }

    private constructor(name: FlagName) {
        this.name = name
    }

    public addPath(internalPath: string): void {
        this.internalPaths.push(internalPath)
    }

    public getPaths(type: 'file' | 'directory'): string[] {
        if (this.internalPaths.length === 0) {
            throw new Error(`Expected at least 1 ${type} with ${this.name}=true, but found none`)
        }
        return this.internalPaths
    }

    public getSinglePath(type: 'file' | 'directory'): string {
        if (this.internalPaths.length !== 1) {
            throw new Error(`Expected exactly 1 ${type} with ${this.name}=true, but found ${this.internalPaths.length}`)
        }
        return this.internalPaths[0]
    }

}
