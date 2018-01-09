/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
