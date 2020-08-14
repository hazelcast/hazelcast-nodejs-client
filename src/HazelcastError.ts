/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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

/** @internal */
export interface HazelcastErrorConstructor {
    readonly prototype: Error;

    new(message: string, cause?: Error): HazelcastError;
}

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

export class HazelcastSerializationError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, HazelcastSerializationError.prototype);
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

export class ClientNotAllowedInClusterError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, ClientNotAllowedInClusterError.prototype);
    }
}

export class ClientOfflineError extends HazelcastError {
    constructor(cause?: Error) {
        super('No connection found to cluster', cause);
        Object.setPrototypeOf(this, ClientOfflineError.prototype);
    }
}

export class InvalidConfigurationError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, InvalidConfigurationError.prototype);
    }
}

export class IllegalStateError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, IllegalStateError.prototype);
    }
}

export class StaleSequenceError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, StaleSequenceError.prototype);
    }
}

export class TopicOverloadError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, TopicOverloadError.prototype);
    }
}

export class IOError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, IOError.prototype);
    }
}

export class UndefinedErrorCodeError extends HazelcastError {
    constructor(msg: string, className: string) {
        super('Class name: ' + className + ' , Message: ' + msg);
        Object.setPrototypeOf(this, UndefinedErrorCodeError.prototype);
    }
}

export class InvocationTimeoutError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, InvocationTimeoutError.prototype);
    }
}

export class RetryableHazelcastError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, RetryableHazelcastError.prototype);
    }
}

export class TargetNotMemberError extends RetryableHazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, TargetNotMemberError.prototype);
    }
}

export class CallerNotMemberError extends RetryableHazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, CallerNotMemberError.prototype);
    }
}

export class CancellationError extends IllegalStateError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, CancellationError.prototype);
    }
}

export class ClassCastError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, ClassCastError.prototype);
    }
}

export class ClassNotFoundError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, ClassNotFoundError.prototype);
    }
}

export class ConcurrentModificationError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, ConcurrentModificationError.prototype);
    }
}

export class ConfigMismatchError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, ConfigMismatchError.prototype);
    }
}

export class DistributedObjectDestroyedError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, DistributedObjectDestroyedError.prototype);
    }
}

export class HazelcastInstanceNotActiveError extends IllegalStateError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, HazelcastInstanceNotActiveError.prototype);
    }
}

export class MemberLeftError extends RetryableHazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, MemberLeftError.prototype);
    }
}

export class PartitionMigratingError extends RetryableHazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, PartitionMigratingError.prototype);
    }
}

export class QueryError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, QueryError.prototype);
    }
}

export class TransactionError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, TransactionError.prototype);
    }
}

export class TransactionNotActiveError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, TransactionNotActiveError.prototype);
    }
}

export class TransactionTimedOutError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, TransactionTimedOutError.prototype);
    }
}

export class SplitBrainProtectionError extends TransactionError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, SplitBrainProtectionError.prototype);
    }
}

export class RetryableIOError extends RetryableHazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, RetryableIOError.prototype);
    }
}

export class TargetDisconnectedError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, TargetDisconnectedError.prototype);
    }
}

export class UnsupportedOperationError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, UnsupportedOperationError.prototype);
    }
}

export class ConsistencyLostError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, ConsistencyLostError.prototype);
    }
}

export class NoDataMemberInClusterError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, NoDataMemberInClusterError.prototype);
    }
}

export class StaleTaskIdError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, StaleTaskIdError.prototype);
    }
}

export class NodeIdOutOfRangeError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, NodeIdOutOfRangeError.prototype);
    }
}

export class ReachedMaxSizeError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, ReachedMaxSizeError.prototype);
    }
}
