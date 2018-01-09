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

export class HazelcastError extends Error {

    cause: Error;
    stack: string;

    constructor(msg: string, cause?: Error) {
        super(msg);
        this.cause = cause;
        Error.captureStackTrace(this, HazelcastError);
        Object.setPrototypeOf(this, HazelcastError.prototype);
    }
}

export class AuthenticationError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, AuthenticationError.prototype);
    }
}

export class ClientNotActiveError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, ClientNotActiveError.prototype);
    }
}

export class IllegalStateError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, IllegalStateError.prototype);
    }
}

export class TopicOverloadError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, TopicOverloadError.prototype);
    }
}
