import { parseDirectory } from 'parser/directory'
import { FileFlags } from 'parser/file-flags'
import type { ShellConfig, UnixConfig } from 'unix-core'

function getShellConfig(): ShellConfig {
    return {
        commandDirectories: FileFlags.get('isCommandDir').getPaths('directory'),
        standardStreams: [
            {
                index: 0,
                internalPath: FileFlags.get('isStdin').getSinglePath('file')
            },
            {
                index: 1,
                internalPath: FileFlags.get('isStdout').getSinglePath('file')
            },
            {
                index: 2,
                internalPath: FileFlags.get('isStderr').getSinglePath('file')
            }
        ],
        startupCommand: {
            command: FileFlags.get('isStartupCommand').getSinglePath('file'),
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
