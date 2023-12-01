import { RootDirectory } from '@/filesystem/root-directory'

const dir = new RootDirectory({
    type: 'directory',
    internalName: 'home',
    children: [
        {
            type: 'file',
            internalName: 'README.md',
            content: 'Hello world!'
        }
    ]
})

console.log(dir.internalChildrenNames)
