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
/** @ignore *//** */

import {
    ArrayIndexOutOfBoundsError,
    ArrayStoreError,
    AuthenticationError,
    CallerNotMemberError,
    CancellationError,
    CannotReplicateError,
    ClassCastError,
    ClassNotFoundError,
    ConcurrentModificationError,
    ConfigMismatchError,
    ConsistencyLostError,
    CPGroupDestroyedError,
    DistributedObjectDestroyedError,
    HazelcastError,
    HazelcastInstanceNotActiveError,
    IllegalStateError,
    InvocationTimeoutError,
    IndeterminateOperationStateError,
    IOError,
    IllegalArgumentError,
    IllegalMonitorStateError,
    IndexOutOfBoundsError,
    InvalidAddressError,
    InvalidConfigurationError,
    InterruptedError,
    LeaderDemotedError,
    LockOwnershipLostError,
    MemberLeftError,
    NegativeArraySizeError,
    NoSuchElementError,
    NoDataMemberInClusterError,
    NodeIdOutOfRangeError,
    NotLeaderError,
    NullPointerError,
    PartitionMigratingError,
    QueryError,
    SessionExpiredError,
    SplitBrainProtectionError,
    RetryableHazelcastError,
    RetryableIOError,
    StaleAppendRequestError,
    StaleSequenceError,
    StaleTaskIdError,
    TargetDisconnectedError,
    TargetNotMemberError,
    TopicOverloadError,
    TransactionError,
    TransactionNotActiveError,
    TransactionTimedOutError,
    UndefinedErrorCodeError,
    UnsupportedOperationError,
    HazelcastSerializationError,
    ReachedMaxSizeError,
    WaitKeyCancelledError,
} from '../core';
import {ClientProtocolErrorCodes} from './ClientProtocolErrorCodes';
import {ClientMessage} from '../protocol/ClientMessage';
import {ErrorsCodec} from '../codec/builtin/ErrorsCodec';
import {ErrorHolder} from './ErrorHolder';
import {StackTraceElement} from './StackTraceElement';

type ErrorFactory = (msg: string, cause: Error, serverStackTrace: StackTraceElement[]) => Error;

/** @internal */
export class ClientErrorFactory {

    private codeToErrorConstructor: Map<number, ErrorFactory> = new Map();

    constructor() {
        this.register(ClientProtocolErrorCodes.ARRAY_INDEX_OUT_OF_BOUNDS,
            (m, c, s) => new ArrayIndexOutOfBoundsError(m, c, s));
        this.register(ClientProtocolErrorCodes.ARRAY_STORE,
            (m, c, s) => new ArrayStoreError(m, c, s));
        this.register(ClientProtocolErrorCodes.AUTHENTICATION,
            (m, c, s) => new AuthenticationError(m, c, s));
        this.register(ClientProtocolErrorCodes.CALLER_NOT_MEMBER,
            (m, c, s) => new CallerNotMemberError(m, c, s));
        this.register(ClientProtocolErrorCodes.CANCELLATION,
            (m, c, s) => new CancellationError(m, c, s));
        this.register(ClientProtocolErrorCodes.CLASS_CAST,
            (m, c, s) => new ClassCastError(m, c, s));
        this.register(ClientProtocolErrorCodes.CLASS_NOT_FOUND,
            (m, c, s) => new ClassNotFoundError(m, c, s));
        this.register(ClientProtocolErrorCodes.CONCURRENT_MODIFICATION,
            (m, c, s) => new ConcurrentModificationError(m, c, s));
        this.register(ClientProtocolErrorCodes.CONFIG_MISMATCH,
            (m, c, s) => new ConfigMismatchError(m, c, s));
        this.register(ClientProtocolErrorCodes.DISTRIBUTED_OBJECT_DESTROYED,
            (m, c, s) => new DistributedObjectDestroyedError(m, c, s));
        this.register(ClientProtocolErrorCodes.EOF,
            (m, c, s) => new IOError(m, c, s));
        this.register(ClientProtocolErrorCodes.HAZELCAST,
            (m, c, s) => new HazelcastError(m, c, s));
        this.register(ClientProtocolErrorCodes.HAZELCAST_INSTANCE_NOT_ACTIVE,
            (m, c, s) => new HazelcastInstanceNotActiveError(m, c, s));
        this.register(ClientProtocolErrorCodes.HAZELCAST_OVERLOAD,
            (m, c, s) => new HazelcastError(m, c, s));
        this.register(ClientProtocolErrorCodes.HAZELCAST_SERIALIZATION,
            (m, c, s) => new HazelcastSerializationError(m, c, s));
        this.register(ClientProtocolErrorCodes.INDETERMINATE_OPERATION_STATE,
            (m, c, s) => new IndeterminateOperationStateError(m, c, s));
        this.register(ClientProtocolErrorCodes.IO,
            (m, c, s) => new IOError(m, c, s));
        this.register(ClientProtocolErrorCodes.ILLEGAL_ARGUMENT,
            (m, c, s) => new IllegalArgumentError(m, c, s));
        this.register(ClientProtocolErrorCodes.ILLEGAL_STATE,
            (m, c, s) => new IllegalStateError(m, c, s));
        this.register(ClientProtocolErrorCodes.INDEX_OUT_OF_BOUNDS,
            (m, c, s) => new IndexOutOfBoundsError(m, c, s));
        this.register(ClientProtocolErrorCodes.INTERRUPTED,
            (m, c, s) => new InterruptedError(m, c, s));
        this.register(ClientProtocolErrorCodes.INVALID_ADDRESS,
            (m, c, s) => new InvalidAddressError(m, c, s));
        this.register(ClientProtocolErrorCodes.INVALID_CONFIGURATION,
            (m, c, s) => new InvalidConfigurationError(m, c, s));
        this.register(ClientProtocolErrorCodes.MEMBER_LEFT,
            (m, c, s) => new MemberLeftError(m, c, s));
        this.register(ClientProtocolErrorCodes.NEGATIVE_ARRAY_SIZE,
            (m, c, s) => new NegativeArraySizeError(m, c, s));
        this.register(ClientProtocolErrorCodes.NO_SUCH_ELEMENT,
            (m, c, s) => new NoSuchElementError(m, c, s));
        this.register(ClientProtocolErrorCodes.NOT_SERIALIZABLE,
            (m, c, s) => new IOError(m, c, s));
        this.register(ClientProtocolErrorCodes.NULL_POINTER,
            (m, c, s) => new NullPointerError(m, c, s));
        this.register(ClientProtocolErrorCodes.OPERATION_TIMEOUT,
            (m, c, s) => new InvocationTimeoutError(m, c, s));
        this.register(ClientProtocolErrorCodes.PARTITION_MIGRATING,
            (m, c, s) => new PartitionMigratingError(m, c, s));
        this.register(ClientProtocolErrorCodes.QUERY,
            (m, c, s) => new QueryError(m, c, s));
        this.register(ClientProtocolErrorCodes.QUERY_RESULT_SIZE_EXCEEDED,
            (m, c, s) => new QueryError(m, c, s));
        this.register(ClientProtocolErrorCodes.SPLIT_BRAIN_PROTECTION,
            (m, c, s) => new SplitBrainProtectionError(m, c, s));
        this.register(ClientProtocolErrorCodes.REACHED_MAX_SIZE,
            (m, c, s) => new ReachedMaxSizeError(m, c, s));
        this.register(ClientProtocolErrorCodes.RETRYABLE_HAZELCAST,
            (m, c, s) => new RetryableHazelcastError(m, c, s));
        this.register(ClientProtocolErrorCodes.RETRYABLE_IO,
            (m, c, s) => new RetryableIOError(m, c, s));
        this.register(ClientProtocolErrorCodes.SOCKET,
            (m, c, s) => new IOError(m, c, s));
        this.register(ClientProtocolErrorCodes.STALE_SEQUENCE,
            (m, c, s) => new StaleSequenceError(m, c, s));
        this.register(ClientProtocolErrorCodes.TARGET_DISCONNECTED,
            (m, c, s) => new TargetDisconnectedError(m, c, s));
        this.register(ClientProtocolErrorCodes.TARGET_NOT_MEMBER,
            (m, c, s) => new TargetNotMemberError(m, c, s));
        this.register(ClientProtocolErrorCodes.TOPIC_OVERLOAD,
            (m, c, s) => new TopicOverloadError(m, c, s));
        this.register(ClientProtocolErrorCodes.TRANSACTION,
            (m, c, s) => new TransactionError(m, c, s));
        this.register(ClientProtocolErrorCodes.TRANSACTION_NOT_ACTIVE,
            (m, c, s) => new TransactionNotActiveError(m, c, s));
        this.register(ClientProtocolErrorCodes.TRANSACTION_TIMED_OUT,
            (m, c, s) => new TransactionTimedOutError(m, c, s));
        this.register(ClientProtocolErrorCodes.UNSUPPORTED_OPERATION,
            (m, c, s) => new UnsupportedOperationError(m, c, s));
        this.register(ClientProtocolErrorCodes.NO_DATA_MEMBER,
            (m, c, s) => new NoDataMemberInClusterError(m, c, s));
        this.register(ClientProtocolErrorCodes.STALE_TASK_ID,
            (m, c, s) => new StaleTaskIdError(m, c, s));
        this.register(ClientProtocolErrorCodes.FLAKE_ID_NODE_ID_OUT_OF_RANGE_EXCEPTION,
            (m, c, s) => new NodeIdOutOfRangeError(m, c, s));
        this.register(ClientProtocolErrorCodes.CONSISTENCY_LOST_EXCEPTION,
            (m, c, s) => new ConsistencyLostError(m, c, s));
        this.register(ClientProtocolErrorCodes.SESSION_EXPIRED_EXCEPTION,
            (m, c, s) => new SessionExpiredError(m, c, s));
        this.register(ClientProtocolErrorCodes.CP_GROUP_DESTROYED_EXCEPTION,
            (m, c, s) => new CPGroupDestroyedError(m, c, s));
        this.register(ClientProtocolErrorCodes.LOCK_OWNERSHIP_LOST_EXCEPTION,
            (m, c, s) => new LockOwnershipLostError(m, c, s));
        this.register(ClientProtocolErrorCodes.ILLEGAL_MONITOR_STATE,
            (m, c, s) => new IllegalMonitorStateError(m, c, s));
        this.register(ClientProtocolErrorCodes.WAIT_KEY_CANCELLED_EXCEPTION,
            (m, c, s) => new WaitKeyCancelledError(m, c, s));
        this.register(ClientProtocolErrorCodes.CANNOT_REPLICATE_EXCEPTION,
            (m, c, s) => new CannotReplicateError(m, c, s));
        this.register(ClientProtocolErrorCodes.LEADER_DEMOTED_EXCEPTION,
            (m, c, s) => new LeaderDemotedError(m, c, s));
        this.register(ClientProtocolErrorCodes.STALE_APPEND_REQUEST_EXCEPTION,
            (m, c, s) => new StaleAppendRequestError(m, c, s));
        this.register(ClientProtocolErrorCodes.NOT_LEADER_EXCEPTION,
            (m, c, s) => new NotLeaderError(m, c, s));
    }

    createErrorFromClientMessage(clientMessage: ClientMessage): Error {
        const errorHolders = ErrorsCodec.decode(clientMessage);
        return this.createError(errorHolders, 0);
    }

    private createError(errorHolders: ErrorHolder[], errorHolderIdx: number): Error {
        if (errorHolderIdx === errorHolders.length) {
            return null;
        }
        const errorHolder = errorHolders[errorHolderIdx];
        const factoryFn = this.codeToErrorConstructor.get(errorHolder.errorCode);
        let error: Error;
        if (factoryFn != null) {
            error = factoryFn(
                errorHolder.message,
                this.createError(errorHolders, errorHolderIdx + 1),
                errorHolder.stackTraceElements
            );
        } else {
            const msg = 'Class name: ' + errorHolder.className + ', Message: ' + errorHolder.message;
            error = new UndefinedErrorCodeError(
                msg,
                this.createError(errorHolders, errorHolderIdx + 1),
                errorHolder.stackTraceElements
            );
        }
        return error;
    }

    private register(code: number, errorFactory: ErrorFactory): void {
        this.codeToErrorConstructor.set(code, errorFactory);
    }
}
