import StackTraceElement = require('./StackTraceElement')

class RemoteException {
    errorCode: number = null;
    className: string = null;
    message: string = null;
    stackTrace: StackTraceElement[] = [];
    causeErrorCode: number = null;
    causeClassName: string = null;
}

export = RemoteException
