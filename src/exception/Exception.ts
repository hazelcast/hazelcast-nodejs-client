import StackTraceElement = require('./StackTraceElement');

class RemoteException {

    private static CODE_HAZELCAST_INSTANCE_NOT_ACTIVE = 21;
    private static CODE_IO_ERROR = 24;
    private static CODE_AUTHENTICATION_ERROR = 3;

    errorCode: number = null;
    className: string = null;
    message: string = null;
    stackTrace: StackTraceElement[] = [];
    causeErrorCode: number = null;
    causeClassName: string = null;

    isRetryable(): boolean {
        return this.errorCode === RemoteException.CODE_AUTHENTICATION_ERROR ||
            this.errorCode === RemoteException.CODE_IO_ERROR ||
            this.errorCode === RemoteException.CODE_HAZELCAST_INSTANCE_NOT_ACTIVE;
    }

}

export = RemoteException;
