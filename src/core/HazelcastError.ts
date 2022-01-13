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
import * as Long from 'long';

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
    }
}

export class HazelcastSerializationError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class SchemaNotFoundError extends HazelcastError {

    schemaId: Long;

    constructor(msg: string, schemaId: Long, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
        this.schemaId = schemaId;
    }
}

export class AuthenticationError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class ClientNotActiveError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
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
    }
}

export class ClientOfflineError extends HazelcastError {
    constructor(cause?: Error) {
        super('No connection found to cluster', cause);
    }
}

export class InvalidConfigurationError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class IllegalStateError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class StaleSequenceError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class TopicOverloadError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class IOError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class OperationTimeoutError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class RetryableHazelcastError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class TargetNotMemberError extends RetryableHazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class CallerNotMemberError extends RetryableHazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class CancellationError extends IllegalStateError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class ClassCastError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class ClassNotFoundError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class ConcurrentModificationError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class ConfigMismatchError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class DistributedObjectDestroyedError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class HazelcastInstanceNotActiveError extends IllegalStateError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class MemberLeftError extends RetryableHazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class PartitionMigratingError extends RetryableHazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class QueryError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class TransactionError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class TransactionNotActiveError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class TransactionTimedOutError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class SplitBrainProtectionError extends TransactionError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class RetryableIOError extends RetryableHazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class TargetDisconnectedError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class UnsupportedOperationError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class ConsistencyLostError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class NoDataMemberInClusterError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class StaleTaskIdError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class NodeIdOutOfRangeError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class ReachedMaxSizeError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class IndeterminateOperationStateError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class ArrayIndexOutOfBoundsError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class ArrayStoreError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class IllegalArgumentError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class IndexOutOfBoundsError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class InterruptedError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class InvalidAddressError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class NegativeArraySizeError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class NoSuchElementError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class NullPointerError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class SessionExpiredError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class CPGroupDestroyedError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class LockOwnershipLostError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class IllegalMonitorStateError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class WaitKeyCancelledError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class LeaderDemotedError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class StaleAppendRequestError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class CannotReplicateError extends RetryableHazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class NotLeaderError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

export class UndefinedErrorCodeError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]) {
        super(msg, cause, serverStackTrace);
    }
}

/**
 * An exception occurred during SQL query execution.
 */
export class HazelcastSqlException extends HazelcastError {
    private readonly code: number;
    /** Suggested SQL statement to remediate experienced error. */
    readonly suggestion : string | null;
    /**
     * ID of the member that caused or initiated an error condition.
     * This can be the client's UUID if error is due to the client.
     */
    readonly originatingMemberId: UUID;

    constructor(
        originatingMemberId: UUID,
        code: number,
        msg: string,
        suggestion : string | null = null,
        cause?: Error,
        serverStackTrace?: ServerErrorStackElement[],
    ) {
        super(msg, cause, serverStackTrace);
        this.code = code;
        this.originatingMemberId = originatingMemberId;
        this.suggestion = suggestion;
    }
}
