import { RootDirectory } from '@/filesystem/directories/root-directory'

const dir = new RootDirectory({
    type: 'directory',
    internalName: 'home',
    children: [
        {
            type: 'text-file',
            internalName: 'README.md',
            content: 'Hello world!'
        }
    ]
})


console.log(prompt(''))
