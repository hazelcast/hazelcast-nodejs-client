/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import ImmutableLazyDataList = require('./ImmutableLazyDataList');
import Address = require('../Address');
import RemoteException = require('../exception/Exception');
import StackTraceElement = require('../exception/StackTraceElement');


class ExceptionCodec {

    static decodeResponse(clientMessage: ClientMessage): RemoteException {
        var exception = new RemoteException();

        exception.errorCode = clientMessage.readInt32();
        exception.className = clientMessage.readString();

        var isMessageNull = clientMessage.readBoolean();
        if (!isMessageNull) {
            exception.message = clientMessage.readString();
        }

        var stackTraceDepth = clientMessage.readInt32();
        exception.stackTrace = [];
        for (var i = 0; i < stackTraceDepth; i++) {
            exception.stackTrace.push(this.decodeStackTraceElement(clientMessage))
        }

        exception.causeErrorCode = clientMessage.readInt32();

        var causeClassNameNull = clientMessage.readBoolean();

        if (!causeClassNameNull) {
            exception.causeClassName = clientMessage.readString();
        }

        return exception;
    }

    private static decodeStackTraceElement(payload: ClientMessage): StackTraceElement {
        var stackTraceElement = new StackTraceElement();

        stackTraceElement.declaringClass = payload.readString();
        stackTraceElement.methodName = payload.readString();

        var fileNameNull = payload.readBoolean();
        if (!fileNameNull) {
            stackTraceElement.fileName = payload.readString();
        }

        stackTraceElement.lineNumber = payload.readInt32();

        return stackTraceElement;
    }
}

export = ExceptionCodec
