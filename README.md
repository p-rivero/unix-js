# unix.js - A fake UNIX terminal

unix.js is an easy-to-use framework for creating realistic terminal experiences and ARGs, anywhere JavaScript can run.

It's written entirely in TypeScript, and can be used in both Node.js and the browser. 

## How does it work?

unix.js scans a directory/folder of your computer and generates a virtual filesystem from it. You can then drop your users into this alternate
reality, and let them explore the filesystem and interact with it.

Extending the functionality of unix.js is as easy as adding new files and subdirectories to the scanned directory.
Executable files are written in JavaScript, but to the user, they look like any other UNIX binary file.  
For example, you can define new terminal commands by creating files in the `/bin` directory of your virtual filesystem, or any other
path you define as executable (`$PATH` variable in UNIX systems).

Scanning a directory is the recommended way to define the virtual filesystem because it's user-friendly and easy to understand, but you can also programmatically define it as a JS object if you prefer.

## What's an ARG?

ARG stands for "Alternate Reality Game". It's a game that takes place in the real world, and uses real-world objects and events to tell a story.

UNIX terminals are commonly used in ARGs to provide a hacker-like experience to the player. However, implementing a decent terminal is usually
not the main focus of the ARG writer, and so the terminal is often mediocre at best and can completely break the immersion.

## Where are the virtual filesystem files stored?

The virtual filesystem is executed on the client side and is always stored in memory. This has the following implications:

1. All changes are lost when the tab or app are closed. If there's demand for LocalStorage persistency, I will add it in the future.

2. The virtual filesystem is limited by the amount of memory available to the browser. This is usually not a problem.

3. The user can gain access to all files in the virtual filesystem, even those with an `accessType` of `hidden` or `locked`. If your users play by the rules or are not tech-savvy, this won't be a problem. However, if you want to ensure that the user cannot read a file until they have a password, you should do one of the following:

    - Store the file in a server instead of the virtual filesystem.  
    Create an executable in the filesystem that requests the password and sends it to the server. The server validates the password and sends back the file, and the executable then writes the file to the virtual filesystem.

    - Encrypt the file and store it in the virtual filesystem. Create an executable in the filesystem that requests the password and decrypts the file.

See a demo of both methods [here](TODO). [TODO: add demo]


## Why not call it *"unix.ts"*?

Since this project is written in TypeScript, it would make sense to call it "unix.ts". However, "ts" can also stand for "time stamp", 
and UNIX timestamps are one of the most popular ways to represent time.  
Since I wanted to avoid confusion and the ".js" suffix is widely used to indicate JS/TS projects, I decided to call it "unix.js" instead.


## Contributing

Development is done using [Bun](https://bun.sh/).

This monorepo contains the following packages:

- `core`: The core library that implements the virtual filesystem and terminal.
- `parser`: A parser for reading the user's directory and generating the virtual filesystem.

First, go to the desired package and install the dependencies:

```bash
cd core
bun install
```

Available commands:

```bash
bun run .
bun lint
bun test
bun bundle
```


## Similar projects

Here are some other fake terminals that I've found, and how they compare to unix.js:

<details>
<summary>Click to expand</summary>

- unix.js
  - The goal is to be a realistic UNIX experience, but full POSIX support is **not** a goal.
  - Extensible (file-based or programmatically)
  - Open source
  - Typed with TypeScript
  - Still in early development

- [JS/UIX](https://www.masswerk.at/jsuix/)
  - Very good UNIX clone (better than unix.js)
  - Old project (from at least 2003)
  - Not extensible
  - Not open source
  - Not typed (plain JavaScript)

- [jquery.terminal](https://github.com/jcubic/jquery.terminal)
  - Good terminal user experience
  - Actively maintained
  - Implements only the terminal functionality, not a UNIX filesystem
  - Extensible by defining new commands (it's up to the developer to implement the logic)
  - Open source
  - Not typed (plain JavaScript)

- [Terminal Temple](https://www.terminaltemple.com/)
  - Acceptable UNIX clone (similar or slightly worse than unix.js)
  - Recent project (from 2023)
  - Not extensible
  - Not open source
  - Typed with TypeScript

- [termly.js](https://simonecorsi.github.io/termly.js)
  - Simple UNIX clone with a few commands and a rudimentary filesystem
  - Not actively maintained (last commit from 2017, archived since 2021)
  - Extensible (programatically)
  - Open source
  - Not typed (plain JavaScript)

- [fake-linux-terminal](https://github.com/jcubic/fake-linux-terminal)
  - Simple UNIX clone with a few commands and a rudimentary filesystem
  - Not extensible
  - Open source
  - Not typed (plain JavaScript)

If you know of any other similar projects, please let me know by opening an issue or a pull request!

</details>
