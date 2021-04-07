/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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

import {UUID} from './UUID';

/** @internal */
export interface HazelcastErrorConstructor {
    readonly prototype: Error;

    new(message: string, cause?: Error): HazelcastError;
}

/**
 * Represents a stack trace element of server-side exception.
 */
export interface ServerErrorStackElement {

    /**
     * Class name.
     */
    className: string;

    /**
     * Method name.
     */
    methodName: string;

    /**
     * Name of the file containing the class.
     */
    fileName: string;

    /**
     * Line number from the class.
     */
    lineNumber: number;

}

/**
 * Base class for all specific exceptions thrown by Hazelcast client.
 */
export class HazelcastError extends Error {

    /**
     * Cause of this exception.
     */
    cause: Error;

    /**
     * Server-side stack trace.
     */
    serverStackTrace?: ServerErrorStackElement[];

    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg);
        this.cause = cause;
        this.serverStackTrace = serverStackTrace;
        Error.captureStackTrace(this, HazelcastError);
        Object.setPrototypeOf(this, HazelcastError.prototype);
    }
}

export class HazelcastSerializationError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, HazelcastSerializationError.prototype);
    }
}

export class AuthenticationError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, AuthenticationError.prototype);
    }
}

export class ClientNotActiveError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, ClientNotActiveError.prototype);
    }
}

/**
 * Thrown when the client can not use a cluster. Examples:
 * - Cluster blacklisted the client
 * - Cluster partition counts are different between alternative clusters
 */
export class ClientNotAllowedInClusterError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
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
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, InvalidConfigurationError.prototype);
    }
}

export class IllegalStateError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, IllegalStateError.prototype);
    }
}

export class StaleSequenceError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, StaleSequenceError.prototype);
    }
}

export class TopicOverloadError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, TopicOverloadError.prototype);
    }
}

export class IOError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, IOError.prototype);
    }
}

export class OperationTimeoutError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, OperationTimeoutError.prototype);
    }
}

export class RetryableHazelcastError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, RetryableHazelcastError.prototype);
    }
}

export class TargetNotMemberError extends RetryableHazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, TargetNotMemberError.prototype);
    }
}

export class CallerNotMemberError extends RetryableHazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, CallerNotMemberError.prototype);
    }
}

export class CancellationError extends IllegalStateError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, CancellationError.prototype);
    }
}

export class ClassCastError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, ClassCastError.prototype);
    }
}

export class ClassNotFoundError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, ClassNotFoundError.prototype);
    }
}

export class ConcurrentModificationError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, ConcurrentModificationError.prototype);
    }
}

export class ConfigMismatchError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, ConfigMismatchError.prototype);
    }
}

export class DistributedObjectDestroyedError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, DistributedObjectDestroyedError.prototype);
    }
}

export class HazelcastInstanceNotActiveError extends IllegalStateError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, HazelcastInstanceNotActiveError.prototype);
    }
}

export class MemberLeftError extends RetryableHazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, MemberLeftError.prototype);
    }
}

export class PartitionMigratingError extends RetryableHazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, PartitionMigratingError.prototype);
    }
}

export class QueryError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, QueryError.prototype);
    }
}

export class TransactionError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, TransactionError.prototype);
    }
}

export class TransactionNotActiveError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, TransactionNotActiveError.prototype);
    }
}

export class TransactionTimedOutError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, TransactionTimedOutError.prototype);
    }
}

export class SplitBrainProtectionError extends TransactionError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, SplitBrainProtectionError.prototype);
    }
}

export class RetryableIOError extends RetryableHazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, RetryableIOError.prototype);
    }
}

export class TargetDisconnectedError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, TargetDisconnectedError.prototype);
    }
}

export class UnsupportedOperationError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, UnsupportedOperationError.prototype);
    }
}

export class ConsistencyLostError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, ConsistencyLostError.prototype);
    }
}

export class NoDataMemberInClusterError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, NoDataMemberInClusterError.prototype);
    }
}

export class StaleTaskIdError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, StaleTaskIdError.prototype);
    }
}

export class NodeIdOutOfRangeError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, NodeIdOutOfRangeError.prototype);
    }
}

export class ReachedMaxSizeError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, ReachedMaxSizeError.prototype);
    }
}

export class IndeterminateOperationStateError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, IndeterminateOperationStateError.prototype);
    }
}

export class ArrayIndexOutOfBoundsError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, ArrayIndexOutOfBoundsError.prototype);
    }
}

export class ArrayStoreError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, ArrayStoreError.prototype);
    }
}

export class IllegalArgumentError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, IllegalArgumentError.prototype);
    }
}

export class IndexOutOfBoundsError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, IndexOutOfBoundsError.prototype);
    }
}

export class InterruptedError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, InterruptedError.prototype);
    }
}

export class InvalidAddressError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, InvalidAddressError.prototype);
    }
}

export class NegativeArraySizeError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, NegativeArraySizeError.prototype);
    }
}

export class NoSuchElementError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, NoSuchElementError.prototype);
    }
}

export class NullPointerError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, NullPointerError.prototype);
    }
}

export class SessionExpiredError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, SessionExpiredError.prototype);
    }
}

export class CPGroupDestroyedError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, CPGroupDestroyedError.prototype);
    }
}

export class LockOwnershipLostError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, LockOwnershipLostError.prototype);
    }
}

export class IllegalMonitorStateError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, IllegalMonitorStateError.prototype);
    }
}

export class WaitKeyCancelledError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, WaitKeyCancelledError.prototype);
    }
}

export class LeaderDemotedError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, LeaderDemotedError.prototype);
    }
}

export class StaleAppendRequestError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, StaleAppendRequestError.prototype);
    }
}

export class CannotReplicateError extends RetryableHazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, CannotReplicateError.prototype);
    }
}

export class NotLeaderError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, NotLeaderError.prototype);
    }
}

export class UndefinedErrorCodeError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, UndefinedErrorCodeError.prototype);
    }
}

export class HazelcastSqlException extends HazelcastError {
    constructor(
        originatingMemberId: UUID,
        code: number,
        msg: string,
        cause?: Error,
        serverStackTrace?: ServerErrorStackElement[]
    ) {
        super(msg, cause, serverStackTrace);
        Object.setPrototypeOf(this, HazelcastSqlException.prototype);
    }
}
