export abstract class UnixJsError extends Error {
    public readonly errno: number
    public readonly linuxName: string
    public readonly linuxDescription: string

    protected constructor(message: string, errno: number, linuxName: string, linuxDescription: string) {
        super(message)
        this.errno = errno
        this.linuxName = linuxName
        this.linuxDescription = linuxDescription
    }
}

export class InternalError extends UnixJsError {
    public constructor(message: string) {
        super(message, 0, 'EINTERNAL', 'Internal error')
        this.name = 'InternalError'
    }
}

export class InvalidArgument extends UnixJsError {
    public constructor(message: string) {
        super(`Incorrect argument: ${message}`, 22, 'EINVAL', 'Invalid argument')
        this.name = 'InvalidArgument'
    }
}

export class PermissionDenied extends UnixJsError {
    public constructor() {
        super('Used lacks permission to perform this action', 13, 'EACCES', 'Permission denied')
        this.name = 'PermissionDenied'
    }
}
