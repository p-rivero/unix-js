import { parseDirectory } from 'parser/directory'
import { FileFlags } from 'parser/file-flags'
import type { ShellConfig, UnixConfig } from 'unix-core'

function getShellConfig(): ShellConfig {
    return {
        // TODO: use PATH env variable to pass command directories
        // commandDirectories: FileFlags.get('isCommandDir').getPaths('directory'),
        standardStreams: [
            {
                index: 0,
                absolutePath: FileFlags.get('isStdin').getSinglePath('file')
            },
            {
                index: 1,
                absolutePath: FileFlags.get('isStdout').getSinglePath('file')
            },
            {
                index: 2,
                absolutePath: FileFlags.get('isStderr').getSinglePath('file')
            }
        ],
        startupCommand: {
            absolutePath: FileFlags.get('isStartupCommand').getSinglePath('file'),
            args: []
        }
    }
}

export async function parseProject(rootDirectoryPath: string): Promise<UnixConfig> {
    const filesystemRoot = await parseDirectory(null, rootDirectoryPath)
    return {
        filesystemRoot,
        homePath: FileFlags.get('isHomeDir').getSinglePath('directory'),
        shell: getShellConfig()
    }
}
