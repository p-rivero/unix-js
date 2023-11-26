import { Directory } from './filesystem/directory'

const dir: Directory = new Directory({
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

console.log(dir.childrenInternalNames)
