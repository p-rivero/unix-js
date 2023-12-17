import fs from 'fs'

import type { DirectoryDTO } from 'unix-js-lib'

export function parseUnixJsDirectory(directoryPath: string): DirectoryDTO {
    const directory = fs.readdirSync(directoryPath)
    return {
        // TODO
    }
}


export default {
    'parseUnixJsDirectory': 'parseUnixJsDirectory'
}
