"use strict";
/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
/** @ignore */ /** */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientErrorFactory = void 0;
const core_1 = require("../core");
const ClientProtocolErrorCodes_1 = require("./ClientProtocolErrorCodes");
const ErrorsCodec_1 = require("../codec/builtin/ErrorsCodec");
/** @internal */
class ClientErrorFactory {
    constructor() {
        this.codeToErrorConstructor = new Map();
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.ARRAY_INDEX_OUT_OF_BOUNDS, (m, c, s) => new core_1.ArrayIndexOutOfBoundsError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.ARRAY_STORE, (m, c, s) => new core_1.ArrayStoreError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.AUTHENTICATION, (m, c, s) => new core_1.AuthenticationError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.CALLER_NOT_MEMBER, (m, c, s) => new core_1.CallerNotMemberError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.CANCELLATION, (m, c, s) => new core_1.CancellationError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.CLASS_CAST, (m, c, s) => new core_1.ClassCastError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.CLASS_NOT_FOUND, (m, c, s) => new core_1.ClassNotFoundError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.CONCURRENT_MODIFICATION, (m, c, s) => new core_1.ConcurrentModificationError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.CONFIG_MISMATCH, (m, c, s) => new core_1.ConfigMismatchError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.DISTRIBUTED_OBJECT_DESTROYED, (m, c, s) => new core_1.DistributedObjectDestroyedError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.EOF, (m, c, s) => new core_1.IOError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.HAZELCAST, (m, c, s) => new core_1.HazelcastError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.HAZELCAST_INSTANCE_NOT_ACTIVE, (m, c, s) => new core_1.HazelcastInstanceNotActiveError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.HAZELCAST_OVERLOAD, (m, c, s) => new core_1.HazelcastError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.HAZELCAST_SERIALIZATION, (m, c, s) => new core_1.HazelcastSerializationError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.INDETERMINATE_OPERATION_STATE, (m, c, s) => new core_1.IndeterminateOperationStateError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.IO, (m, c, s) => new core_1.IOError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.ILLEGAL_ARGUMENT, (m, c, s) => new core_1.IllegalArgumentError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.ILLEGAL_STATE, (m, c, s) => new core_1.IllegalStateError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.INDEX_OUT_OF_BOUNDS, (m, c, s) => new core_1.IndexOutOfBoundsError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.INTERRUPTED, (m, c, s) => new core_1.InterruptedError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.INVALID_ADDRESS, (m, c, s) => new core_1.InvalidAddressError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.INVALID_CONFIGURATION, (m, c, s) => new core_1.InvalidConfigurationError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.MEMBER_LEFT, (m, c, s) => new core_1.MemberLeftError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.NEGATIVE_ARRAY_SIZE, (m, c, s) => new core_1.NegativeArraySizeError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.NO_SUCH_ELEMENT, (m, c, s) => new core_1.NoSuchElementError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.NOT_SERIALIZABLE, (m, c, s) => new core_1.IOError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.NULL_POINTER, (m, c, s) => new core_1.NullPointerError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.OPERATION_TIMEOUT, (m, c, s) => new core_1.OperationTimeoutError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.PARTITION_MIGRATING, (m, c, s) => new core_1.PartitionMigratingError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.QUERY, (m, c, s) => new core_1.QueryError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.QUERY_RESULT_SIZE_EXCEEDED, (m, c, s) => new core_1.QueryError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.SPLIT_BRAIN_PROTECTION, (m, c, s) => new core_1.SplitBrainProtectionError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.REACHED_MAX_SIZE, (m, c, s) => new core_1.ReachedMaxSizeError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.RETRYABLE_HAZELCAST, (m, c, s) => new core_1.RetryableHazelcastError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.RETRYABLE_IO, (m, c, s) => new core_1.RetryableIOError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.SOCKET, (m, c, s) => new core_1.IOError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.STALE_SEQUENCE, (m, c, s) => new core_1.StaleSequenceError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.TARGET_DISCONNECTED, (m, c, s) => new core_1.TargetDisconnectedError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.TARGET_NOT_MEMBER, (m, c, s) => new core_1.TargetNotMemberError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.TOPIC_OVERLOAD, (m, c, s) => new core_1.TopicOverloadError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.TRANSACTION, (m, c, s) => new core_1.TransactionError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.TRANSACTION_NOT_ACTIVE, (m, c, s) => new core_1.TransactionNotActiveError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.TRANSACTION_TIMED_OUT, (m, c, s) => new core_1.TransactionTimedOutError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.UNSUPPORTED_OPERATION, (m, c, s) => new core_1.UnsupportedOperationError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.NO_DATA_MEMBER, (m, c, s) => new core_1.NoDataMemberInClusterError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.STALE_TASK_ID, (m, c, s) => new core_1.StaleTaskIdError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.FLAKE_ID_NODE_ID_OUT_OF_RANGE_EXCEPTION, (m, c, s) => new core_1.NodeIdOutOfRangeError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.CONSISTENCY_LOST_EXCEPTION, (m, c, s) => new core_1.ConsistencyLostError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.SESSION_EXPIRED_EXCEPTION, (m, c, s) => new core_1.SessionExpiredError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.CP_GROUP_DESTROYED_EXCEPTION, (m, c, s) => new core_1.CPGroupDestroyedError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.LOCK_OWNERSHIP_LOST_EXCEPTION, (m, c, s) => new core_1.LockOwnershipLostError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.ILLEGAL_MONITOR_STATE, (m, c, s) => new core_1.IllegalMonitorStateError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.WAIT_KEY_CANCELLED_EXCEPTION, (m, c, s) => new core_1.WaitKeyCancelledError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.CANNOT_REPLICATE_EXCEPTION, (m, c, s) => new core_1.CannotReplicateError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.LEADER_DEMOTED_EXCEPTION, (m, c, s) => new core_1.LeaderDemotedError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.STALE_APPEND_REQUEST_EXCEPTION, (m, c, s) => new core_1.StaleAppendRequestError(m, c, s));
        this.register(ClientProtocolErrorCodes_1.ClientProtocolErrorCodes.NOT_LEADER_EXCEPTION, (m, c, s) => new core_1.NotLeaderError(m, c, s));
    }
    createErrorFromClientMessage(clientMessage) {
        const errorHolders = ErrorsCodec_1.ErrorsCodec.decode(clientMessage);
        return this.createError(errorHolders, 0);
    }
    createError(errorHolders, errorHolderIdx) {
        if (errorHolderIdx === errorHolders.length) {
            return null;
        }
        const errorHolder = errorHolders[errorHolderIdx];
        const factoryFn = this.codeToErrorConstructor.get(errorHolder.errorCode);
        let error;
        if (factoryFn != null) {
            error = factoryFn(errorHolder.message, this.createError(errorHolders, errorHolderIdx + 1), errorHolder.stackTraceElements);
        }
        else {
            const msg = 'Class name: ' + errorHolder.className + ', Message: ' + errorHolder.message;
            error = new core_1.UndefinedErrorCodeError(msg, this.createError(errorHolders, errorHolderIdx + 1), errorHolder.stackTraceElements);
        }
        return error;
    }
    register(code, errorFactory) {
        this.codeToErrorConstructor.set(code, errorFactory);
    }
}
exports.ClientErrorFactory = ClientErrorFactory;
//# sourceMappingURL=ErrorFactory.js.map