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

import {
    AuthenticationError, CallerNotMemberError, CancellationError, ClassCastError, ClassNotFoundError, ConcurrentModificationError,
    ConfigMismatchError, ConfigurationError, DistributedObjectDestroyedError, DuplicateInstanceNameError, HazelcastError,
    HazelcastInstanceNotActiveError, IllegalStateError, IOError, MemberLeftError, NoDataMemberInClusterError,
    OperationTimeoutError, PartitionMigratingError, QueryError, QuorumError, RetryableHazelcastError, RetryableIOError,
    StaleSequenceError, StaleTaskIdError, TargetDisconnectedError, TargetNotMemberError, TopicOverloadError, TransactionError,
    TransactionNotActiveError, TransactionTimedOutError, UndefinedErrorCodeError, UnsupportedOperationError
} from '../HazelcastError';
import {ClientProtocolErrorCodes} from './ClientProtocolErrorCodes';
import {ErrorCodec} from './ErrorCodec';
import ClientMessage = require('../ClientMessage');

interface ErrorFactory {
    (msg: string, cause: Error): Error;
}

export class ClientErrorFactory {

    private codeToErrorConstructor: Map<number, ErrorFactory> = new Map();

    constructor() {
        this.register(ClientProtocolErrorCodes.ARRAY_INDEX_OUT_OF_BOUNDS, (m, c) => new RangeError(m));
        this.register(ClientProtocolErrorCodes.ARRAY_STORE, (m, c) => new TypeError(m));
        this.register(ClientProtocolErrorCodes.AUTHENTICATION, (m, c) => new AuthenticationError(m, c));
        this.register(ClientProtocolErrorCodes.CALLER_NOT_MEMBER, (m, c) => new CallerNotMemberError(m, c));
        this.register(ClientProtocolErrorCodes.CANCELLATION, (m, c) => new CancellationError(m, c));
        this.register(ClientProtocolErrorCodes.CLASS_CAST, (m, c) => new ClassCastError(m, c));
        this.register(ClientProtocolErrorCodes.CLASS_NOT_FOUND, (m, c) => new ClassNotFoundError(m, c));
        this.register(ClientProtocolErrorCodes.CONCURRENT_MODIFICATION, (m, c) => new ConcurrentModificationError(m, c));
        this.register(ClientProtocolErrorCodes.CONFIG_MISMATCH, (m, c) => new ConfigMismatchError(m, c));
        this.register(ClientProtocolErrorCodes.CONFIGURATION, (m, c) => new ConfigurationError(m, c));
        this.register(ClientProtocolErrorCodes.DISTRIBUTED_OBJECT_DESTROYED, (m, c) => new DistributedObjectDestroyedError(m, c));
        this.register(ClientProtocolErrorCodes.DUPLICATE_INSTANCE_NAME, (m, c) => new DuplicateInstanceNameError(m, c));
        this.register(ClientProtocolErrorCodes.EOF, (m, c) => new IOError(m, c));
        this.register(ClientProtocolErrorCodes.HAZELCAST, (m, c) => new HazelcastError(m, c));
        this.register(ClientProtocolErrorCodes.HAZELCAST_INSTANCE_NOT_ACTIVE,
            (m, c) => new HazelcastInstanceNotActiveError(m, c));
        this.register(ClientProtocolErrorCodes.HAZELCAST_OVERLOAD, (m, c) => new HazelcastError(m, c));
        this.register(ClientProtocolErrorCodes.HAZELCAST_SERIALIZATION, (m, c) => new HazelcastError(m, c));
        this.register(ClientProtocolErrorCodes.IO, (m, c) => new IOError(m, c));
        this.register(ClientProtocolErrorCodes.ILLEGAL_ARGUMENT, (m, c) => new TypeError(m));
        this.register(ClientProtocolErrorCodes.ILLEGAL_STATE, (m, c) => new IllegalStateError(m, c));
        this.register(ClientProtocolErrorCodes.INDEX_OUT_OF_BOUNDS, (m, c) => new RangeError(m));
        this.register(ClientProtocolErrorCodes.INTERRUPTED, (m, c) => new Error(m));
        this.register(ClientProtocolErrorCodes.INVALID_ADDRESS, (m, c) => new TypeError(m));
        this.register(ClientProtocolErrorCodes.INVALID_CONFIGURATION, (m, c) => new TypeError(m));
        this.register(ClientProtocolErrorCodes.MEMBER_LEFT, (m, c) => new MemberLeftError(m, c));
        this.register(ClientProtocolErrorCodes.NEGATIVE_ARRAY_SIZE, (m, c) => new RangeError(m));
        this.register(ClientProtocolErrorCodes.NO_SUCH_ELEMENT, (m, c) => new ReferenceError(m));
        this.register(ClientProtocolErrorCodes.NOT_SERIALIZABLE, (m, c) => new IOError(m, c));
        this.register(ClientProtocolErrorCodes.NULL_POINTER, (m, c) => new ReferenceError(m));
        this.register(ClientProtocolErrorCodes.OPERATION_TIMEOUT, (m, c) => new OperationTimeoutError(m, c));
        this.register(ClientProtocolErrorCodes.PARTITION_MIGRATING, (m, c) => new PartitionMigratingError(m, c));
        this.register(ClientProtocolErrorCodes.QUERY, (m, c) => new QueryError(m, c));
        this.register(ClientProtocolErrorCodes.QUERY_RESULT_SIZE_EXCEEDED, (m, c) => new QueryError(m, c));
        this.register(ClientProtocolErrorCodes.QUORUM, (m, c) => new QuorumError(m, c));
        this.register(ClientProtocolErrorCodes.RETRYABLE_HAZELCAST, (m, c) => new RetryableHazelcastError(m, c));
        this.register(ClientProtocolErrorCodes.RETRYABLE_IO, (m, c) => new RetryableIOError(m, c));
        this.register(ClientProtocolErrorCodes.SOCKET, (m, c) => new IOError(m, c));
        this.register(ClientProtocolErrorCodes.STALE_SEQUENCE, (m, c) => new StaleSequenceError(m, c));
        this.register(ClientProtocolErrorCodes.TARGET_DISCONNECTED, (m, c) => new TargetDisconnectedError(m, c));
        this.register(ClientProtocolErrorCodes.TARGET_NOT_MEMBER, (m, c) => new TargetNotMemberError(m, c));
        this.register(ClientProtocolErrorCodes.TOPIC_OVERLOAD, (m, c) => new TopicOverloadError(m, c));
        this.register(ClientProtocolErrorCodes.TRANSACTION, (m, c) => new TransactionError(m, c));
        this.register(ClientProtocolErrorCodes.TRANSACTION_NOT_ACTIVE, (m, c) => new TransactionNotActiveError(m, c));
        this.register(ClientProtocolErrorCodes.TRANSACTION_TIMED_OUT, (m, c) => new TransactionTimedOutError(m, c));
        this.register(ClientProtocolErrorCodes.UNSUPPORTED_OPERATION, (m, c) => new UnsupportedOperationError(m, c));
        this.register(ClientProtocolErrorCodes.NO_DATA_MEMBER, (m, c) => new NoDataMemberInClusterError(m, c));
        this.register(ClientProtocolErrorCodes.STALE_TASK_ID, (m, c) => new StaleTaskIdError(m, c));
    }

    private register(code: number, errorFactory: ErrorFactory): void {
        this.codeToErrorConstructor.set(code, errorFactory);
    }

    createErrorFromClientMessage(clientMessage: ClientMessage) : Error {
        let errorCodec = ErrorCodec.decode(clientMessage);
        return this.createError(errorCodec.errorCode, errorCodec.className, errorCodec.message, null);
    }

    createError(errorCode: number, className: string, message: string, cause: Error): Error {
        let factoryFunc = this.codeToErrorConstructor.get(errorCode);
        if (factoryFunc != null) {
            return factoryFunc(message, cause);
        } else {
            return new UndefinedErrorCodeError(message, className);
        }
    }
}
