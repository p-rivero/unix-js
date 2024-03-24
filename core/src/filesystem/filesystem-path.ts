import { HOME_DIR, PATH_SEPARATOR } from 'filesystem/constants'
import { assert } from 'utils'

export class FilesystemPath {

    public readonly isAbsolute: boolean
    public readonly isRelativeToHome: boolean
    public readonly parts: string[]

    public constructor(path: string) {
        const pathTrim = path.trim()
        this.isAbsolute = FilesystemPath.pathIsAbsolute(pathTrim)
        this.isRelativeToHome = FilesystemPath.pathIsRelativeToHome(pathTrim)
        this.parts = pathTrim.split(PATH_SEPARATOR).filter(part => part.length > 0)
        
        if (this.isRelativeToHome) {
            const first = this.parts.shift()
            assert(first === HOME_DIR)
        }
    }

    private static pathIsAbsolute(pathTrim: string): boolean {
        return pathTrim.startsWith(PATH_SEPARATOR)
    }

    private static pathIsRelativeToHome(pathTrim: string): boolean {
        return pathTrim === HOME_DIR || pathTrim.startsWith(HOME_DIR + PATH_SEPARATOR)
    }
}
