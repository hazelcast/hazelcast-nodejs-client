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
    ClassCastError,
    ClassNotFoundError,
    ConcurrentModificationError,
    ConfigMismatchError,
    ConsistencyLostError,
    DistributedObjectDestroyedError,
    HazelcastError,
    HazelcastInstanceNotActiveError,
    IllegalStateError,
    InvocationTimeoutError,
    IndeterminateOperationStateError,
    IOError,
    IllegalArgumentError,
    IndexOutOfBoundsError,
    InvalidAddressError,
    InvalidConfigurationError,
    InterruptedError,
    MemberLeftError,
    NegativeArraySizeError,
    NoSuchElementError,
    NoDataMemberInClusterError,
    NodeIdOutOfRangeError,
    NullPointerError,
    PartitionMigratingError,
    QueryError,
    SplitBrainProtectionError,
    RetryableHazelcastError,
    RetryableIOError,
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
} from '../core';
import {ClientProtocolErrorCodes} from './ClientProtocolErrorCodes';
import {ClientMessage} from '../protocol/ClientMessage';
import {ErrorsCodec} from '../codec/builtin/ErrorsCodec';
import {ErrorHolder} from './ErrorHolder';

type ErrorFactory = (msg: string, cause: Error, serverError: ErrorHolder) => Error;

/** @internal */
export class ClientErrorFactory {

    private codeToErrorConstructor: Map<number, ErrorFactory> = new Map();

    constructor() {
        this.register(ClientProtocolErrorCodes.ARRAY_INDEX_OUT_OF_BOUNDS,
            (m, c, e) => new ArrayIndexOutOfBoundsError(m, c, e));
        this.register(ClientProtocolErrorCodes.ARRAY_STORE,
            (m, c, e) => new ArrayStoreError(m, c, e));
        this.register(ClientProtocolErrorCodes.AUTHENTICATION,
            (m, c, e) => new AuthenticationError(m, c, e));
        this.register(ClientProtocolErrorCodes.CALLER_NOT_MEMBER,
            (m, c, e) => new CallerNotMemberError(m, c, e));
        this.register(ClientProtocolErrorCodes.CANCELLATION,
            (m, c, e) => new CancellationError(m, c, e));
        this.register(ClientProtocolErrorCodes.CLASS_CAST,
            (m, c, e) => new ClassCastError(m, c, e));
        this.register(ClientProtocolErrorCodes.CLASS_NOT_FOUND,
            (m, c, e) => new ClassNotFoundError(m, c, e));
        this.register(ClientProtocolErrorCodes.CONCURRENT_MODIFICATION,
            (m, c, e) => new ConcurrentModificationError(m, c, e));
        this.register(ClientProtocolErrorCodes.CONFIG_MISMATCH,
            (m, c, e) => new ConfigMismatchError(m, c, e));
        this.register(ClientProtocolErrorCodes.DISTRIBUTED_OBJECT_DESTROYED,
            (m, c, e) => new DistributedObjectDestroyedError(m, c, e));
        this.register(ClientProtocolErrorCodes.EOF,
            (m, c, e) => new IOError(m, c, e));
        this.register(ClientProtocolErrorCodes.HAZELCAST,
            (m, c, e) => new HazelcastError(m, c, e));
        this.register(ClientProtocolErrorCodes.HAZELCAST_INSTANCE_NOT_ACTIVE,
            (m, c, e) => new HazelcastInstanceNotActiveError(m, c, e));
        this.register(ClientProtocolErrorCodes.HAZELCAST_OVERLOAD,
            (m, c, e) => new HazelcastError(m, c, e));
        this.register(ClientProtocolErrorCodes.HAZELCAST_SERIALIZATION,
            (m, c, e) => new HazelcastSerializationError(m, c, e));
        this.register(ClientProtocolErrorCodes.INDETERMINATE_OPERATION_STATE,
            (m, c, e) => new IndeterminateOperationStateError(m, c, e));
        this.register(ClientProtocolErrorCodes.IO,
            (m, c, e) => new IOError(m, c, e));
        this.register(ClientProtocolErrorCodes.ILLEGAL_ARGUMENT,
            (m, c, e) => new IllegalArgumentError(m, c, e));
        this.register(ClientProtocolErrorCodes.ILLEGAL_STATE,
            (m, c, e) => new IllegalStateError(m, c, e));
        this.register(ClientProtocolErrorCodes.INDEX_OUT_OF_BOUNDS,
            (m, c, e) => new IndexOutOfBoundsError(m, c, e));
        this.register(ClientProtocolErrorCodes.INTERRUPTED,
            (m, c, e) => new InterruptedError(m, c, e));
        this.register(ClientProtocolErrorCodes.INVALID_ADDRESS,
            (m, c, e) => new InvalidAddressError(m, c, e));
        this.register(ClientProtocolErrorCodes.INVALID_CONFIGURATION,
            (m, c, e) => new InvalidConfigurationError(m, c, e));
        this.register(ClientProtocolErrorCodes.MEMBER_LEFT,
            (m, c, e) => new MemberLeftError(m, c, e));
        this.register(ClientProtocolErrorCodes.NEGATIVE_ARRAY_SIZE,
            (m, c, e) => new NegativeArraySizeError(m, c, e));
        this.register(ClientProtocolErrorCodes.NO_SUCH_ELEMENT,
            (m, c, e) => new NoSuchElementError(m, c, e));
        this.register(ClientProtocolErrorCodes.NOT_SERIALIZABLE,
            (m, c, e) => new IOError(m, c, e));
        this.register(ClientProtocolErrorCodes.NULL_POINTER,
            (m, c, e) => new NullPointerError(m, c, e));
        this.register(ClientProtocolErrorCodes.OPERATION_TIMEOUT,
            (m, c, e) => new InvocationTimeoutError(m, c, e));
        this.register(ClientProtocolErrorCodes.PARTITION_MIGRATING,
            (m, c, e) => new PartitionMigratingError(m, c, e));
        this.register(ClientProtocolErrorCodes.QUERY,
            (m, c, e) => new QueryError(m, c, e));
        this.register(ClientProtocolErrorCodes.QUERY_RESULT_SIZE_EXCEEDED,
            (m, c, e) => new QueryError(m, c, e));
        this.register(ClientProtocolErrorCodes.SPLIT_BRAIN_PROTECTION,
            (m, c, e) => new SplitBrainProtectionError(m, c, e));
        this.register(ClientProtocolErrorCodes.REACHED_MAX_SIZE,
            (m, c, e) => new ReachedMaxSizeError(m, c, e));
        this.register(ClientProtocolErrorCodes.RETRYABLE_HAZELCAST,
            (m, c, e) => new RetryableHazelcastError(m, c, e));
        this.register(ClientProtocolErrorCodes.RETRYABLE_IO,
            (m, c, e) => new RetryableIOError(m, c, e));
        this.register(ClientProtocolErrorCodes.SOCKET,
            (m, c, e) => new IOError(m, c, e));
        this.register(ClientProtocolErrorCodes.STALE_SEQUENCE,
            (m, c, e) => new StaleSequenceError(m, c, e));
        this.register(ClientProtocolErrorCodes.TARGET_DISCONNECTED,
            (m, c, e) => new TargetDisconnectedError(m, c, e));
        this.register(ClientProtocolErrorCodes.TARGET_NOT_MEMBER,
            (m, c, e) => new TargetNotMemberError(m, c, e));
        this.register(ClientProtocolErrorCodes.TOPIC_OVERLOAD,
            (m, c, e) => new TopicOverloadError(m, c, e));
        this.register(ClientProtocolErrorCodes.TRANSACTION,
            (m, c, e) => new TransactionError(m, c, e));
        this.register(ClientProtocolErrorCodes.TRANSACTION_NOT_ACTIVE,
            (m, c, e) => new TransactionNotActiveError(m, c, e));
        this.register(ClientProtocolErrorCodes.TRANSACTION_TIMED_OUT,
            (m, c, e) => new TransactionTimedOutError(m, c, e));
        this.register(ClientProtocolErrorCodes.UNSUPPORTED_OPERATION,
            (m, c, e) => new UnsupportedOperationError(m, c, e));
        this.register(ClientProtocolErrorCodes.NO_DATA_MEMBER,
            (m, c, e) => new NoDataMemberInClusterError(m, c, e));
        this.register(ClientProtocolErrorCodes.STALE_TASK_ID,
            (m, c, e) => new StaleTaskIdError(m, c, e));
        this.register(ClientProtocolErrorCodes.FLAKE_ID_NODE_ID_OUT_OF_RANGE_EXCEPTION,
            (m, c, e) => new NodeIdOutOfRangeError(m, c, e));
        this.register(ClientProtocolErrorCodes.CONSISTENCY_LOST_EXCEPTION,
            (m, c, e) => new ConsistencyLostError(m, c, e));
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
            error = factoryFn(errorHolder.message, this.createError(errorHolders, errorHolderIdx + 1), errorHolder);
        } else {
            error = new UndefinedErrorCodeError(errorHolder.message, errorHolder.className);
        }
        return error;
    }

    private register(code: number, errorFactory: ErrorFactory): void {
        this.codeToErrorConstructor.set(code, errorFactory);
    }
}
