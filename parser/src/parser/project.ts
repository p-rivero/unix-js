import { parseDirectory } from 'parser/directory'
import { FileFlags } from 'parser/file-flags'
import type { ShellConfig, UnixConfig } from 'unix-lib'

function getShellConfig(): ShellConfig {
    return {
        commandDirectories: FileFlags.get('isCommandDir').getInternalPaths('directory'),
        standardStreams: [
            {
                index: 0,
                internalPath: FileFlags.get('isStdin').getSingleInternalPath('file')
            },
            {
                index: 1,
                internalPath: FileFlags.get('isStdout').getSingleInternalPath('file')
            },
            {
                index: 2,
                internalPath: FileFlags.get('isStderr').getSingleInternalPath('file')
            }
        ],
        startupCommand: {
            command: FileFlags.get('isStartupCommand').getSingleInternalPath('file'),
            args: []
        }
    }
}

export async function parseProject(rootDirectoryPath: string): Promise<UnixConfig> {
    const filesystemRoot = await parseDirectory(null, rootDirectoryPath)
    return {
        filesystemRoot,
        homePath: FileFlags.get('isHomeDir').getSingleInternalPath('directory'),
        shell: getShellConfig()
    }
}
