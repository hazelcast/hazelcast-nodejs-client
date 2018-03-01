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

import ClientMessage = require('../ClientMessage');

export class StackTraceElementCodec {
    declaringClass: string = null;
    methodName: string = null;
    fileName: string = null;
    lineNumber: number = null;

    static decode(payload: ClientMessage): StackTraceElementCodec {
        var stackTraceElement = new StackTraceElementCodec();

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

