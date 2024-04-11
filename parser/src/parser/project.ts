import { parseRootDirectory } from 'parser/directory-root'
import { FileFlags } from 'parser/file-flags'
import type { GlobalSettingsMetadata } from 'parser/metadata'
import type { ShellConfig, UnixConfig } from 'unix-core'

function getShellConfig(settings: GlobalSettingsMetadata): ShellConfig {
    return {
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
        },
        echoCtrlC: settings.echoCtrlC ?? true
    }
}

export async function parseProject(rootDirectoryPath: string): Promise<UnixConfig> {
    const [filesystemRoot, globalSettings] = await parseRootDirectory(rootDirectoryPath)
    return {
        filesystemRoot,
        environmentVariables: {
            HOME: FileFlags.get('isHomeDir').getSinglePath('directory'),
            PATH: FileFlags.get('isCommandPath').getPaths('directory').join(':')
        },
        shell: getShellConfig(globalSettings)
    }
}
