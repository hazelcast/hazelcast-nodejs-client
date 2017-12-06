/*
 * Copyright (c) 2008-2017, Hazelcast, Inc. All Rights Reserved.
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
