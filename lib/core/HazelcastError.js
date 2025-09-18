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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NullPointerError = exports.NoSuchElementError = exports.NegativeArraySizeError = exports.InvalidAddressError = exports.InterruptedError = exports.IndexOutOfBoundsError = exports.IllegalArgumentError = exports.ArrayStoreError = exports.ArrayIndexOutOfBoundsError = exports.IndeterminateOperationStateError = exports.ReachedMaxSizeError = exports.NodeIdOutOfRangeError = exports.StaleTaskIdError = exports.NoDataMemberInClusterError = exports.ConsistencyLostError = exports.UnsupportedOperationError = exports.TargetDisconnectedError = exports.RetryableIOError = exports.SplitBrainProtectionError = exports.TransactionTimedOutError = exports.TransactionNotActiveError = exports.TransactionError = exports.QueryError = exports.PartitionMigratingError = exports.MemberLeftError = exports.HazelcastInstanceNotActiveError = exports.DistributedObjectDestroyedError = exports.ConfigMismatchError = exports.ConcurrentModificationError = exports.ClassNotFoundError = exports.ClassCastError = exports.CancellationError = exports.CallerNotMemberError = exports.TargetNotMemberError = exports.RetryableHazelcastError = exports.OperationTimeoutError = exports.IOError = exports.TopicOverloadError = exports.StaleSequenceError = exports.InvocationMightContainCompactDataError = exports.IllegalStateError = exports.InvalidConfigurationError = exports.ClientOfflineError = exports.ClientNotAllowedInClusterError = exports.ClientNotActiveError = exports.AuthenticationError = exports.SchemaNotReplicatedError = exports.SchemaNotFoundError = exports.HazelcastSerializationError = exports.HazelcastError = void 0;
exports.HazelcastSqlException = exports.UndefinedErrorCodeError = exports.NotLeaderError = exports.CannotReplicateError = exports.StaleAppendRequestError = exports.LeaderDemotedError = exports.WaitKeyCancelledError = exports.IllegalMonitorStateError = exports.LockOwnershipLostError = exports.CPGroupDestroyedError = exports.SessionExpiredError = void 0;
/**
 * Base class for all specific exceptions thrown by Hazelcast client.
 */
class HazelcastError extends Error {
    constructor(msg, cause, serverStackTrace) {
        super(msg);
        this.cause = cause;
        this.serverStackTrace = serverStackTrace;
        Error.captureStackTrace(this, HazelcastError);
        if (cause !== undefined && cause !== null) {
            this.stack += '\nCaused by ' + cause.stack.toString();
        }
    }
}
exports.HazelcastError = HazelcastError;
class HazelcastSerializationError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.HazelcastSerializationError = HazelcastSerializationError;
/**
 * @internal
 */
class SchemaNotFoundError extends HazelcastError {
    constructor(msg, schemaId, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
        this.schemaId = schemaId;
    }
}
exports.SchemaNotFoundError = SchemaNotFoundError;
/**
 * @internal
 */
class SchemaNotReplicatedError extends HazelcastError {
    constructor(msg, schema, 
    // clazz is undefined when generic record schema is not replicated
    /* eslint-disable-next-line @typescript-eslint/ban-types */
    clazz, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
        this.schema = schema;
        this.clazz = clazz;
    }
}
exports.SchemaNotReplicatedError = SchemaNotReplicatedError;
class AuthenticationError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.AuthenticationError = AuthenticationError;
class ClientNotActiveError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.ClientNotActiveError = ClientNotActiveError;
/**
 * Thrown when the client can not use a cluster. Examples:
 * - Cluster blacklisted the client
 * - Cluster partition counts are different between alternative clusters
 */
class ClientNotAllowedInClusterError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.ClientNotAllowedInClusterError = ClientNotAllowedInClusterError;
class ClientOfflineError extends HazelcastError {
    constructor(cause) {
        super('No connection found to cluster', cause);
    }
}
exports.ClientOfflineError = ClientOfflineError;
class InvalidConfigurationError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.InvalidConfigurationError = InvalidConfigurationError;
class IllegalStateError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.IllegalStateError = IllegalStateError;
class InvocationMightContainCompactDataError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.InvocationMightContainCompactDataError = InvocationMightContainCompactDataError;
class StaleSequenceError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.StaleSequenceError = StaleSequenceError;
class TopicOverloadError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.TopicOverloadError = TopicOverloadError;
class IOError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.IOError = IOError;
class OperationTimeoutError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.OperationTimeoutError = OperationTimeoutError;
class RetryableHazelcastError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.RetryableHazelcastError = RetryableHazelcastError;
class TargetNotMemberError extends RetryableHazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.TargetNotMemberError = TargetNotMemberError;
class CallerNotMemberError extends RetryableHazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.CallerNotMemberError = CallerNotMemberError;
class CancellationError extends IllegalStateError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.CancellationError = CancellationError;
class ClassCastError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.ClassCastError = ClassCastError;
class ClassNotFoundError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.ClassNotFoundError = ClassNotFoundError;
class ConcurrentModificationError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.ConcurrentModificationError = ConcurrentModificationError;
class ConfigMismatchError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.ConfigMismatchError = ConfigMismatchError;
class DistributedObjectDestroyedError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.DistributedObjectDestroyedError = DistributedObjectDestroyedError;
class HazelcastInstanceNotActiveError extends IllegalStateError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.HazelcastInstanceNotActiveError = HazelcastInstanceNotActiveError;
class MemberLeftError extends RetryableHazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.MemberLeftError = MemberLeftError;
class PartitionMigratingError extends RetryableHazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.PartitionMigratingError = PartitionMigratingError;
class QueryError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.QueryError = QueryError;
class TransactionError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.TransactionError = TransactionError;
class TransactionNotActiveError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.TransactionNotActiveError = TransactionNotActiveError;
class TransactionTimedOutError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.TransactionTimedOutError = TransactionTimedOutError;
class SplitBrainProtectionError extends TransactionError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.SplitBrainProtectionError = SplitBrainProtectionError;
class RetryableIOError extends RetryableHazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.RetryableIOError = RetryableIOError;
class TargetDisconnectedError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.TargetDisconnectedError = TargetDisconnectedError;
class UnsupportedOperationError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.UnsupportedOperationError = UnsupportedOperationError;
class ConsistencyLostError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.ConsistencyLostError = ConsistencyLostError;
class NoDataMemberInClusterError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.NoDataMemberInClusterError = NoDataMemberInClusterError;
class StaleTaskIdError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.StaleTaskIdError = StaleTaskIdError;
class NodeIdOutOfRangeError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.NodeIdOutOfRangeError = NodeIdOutOfRangeError;
class ReachedMaxSizeError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.ReachedMaxSizeError = ReachedMaxSizeError;
class IndeterminateOperationStateError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.IndeterminateOperationStateError = IndeterminateOperationStateError;
class ArrayIndexOutOfBoundsError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.ArrayIndexOutOfBoundsError = ArrayIndexOutOfBoundsError;
class ArrayStoreError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.ArrayStoreError = ArrayStoreError;
class IllegalArgumentError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.IllegalArgumentError = IllegalArgumentError;
class IndexOutOfBoundsError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.IndexOutOfBoundsError = IndexOutOfBoundsError;
class InterruptedError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.InterruptedError = InterruptedError;
class InvalidAddressError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.InvalidAddressError = InvalidAddressError;
class NegativeArraySizeError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.NegativeArraySizeError = NegativeArraySizeError;
class NoSuchElementError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.NoSuchElementError = NoSuchElementError;
class NullPointerError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.NullPointerError = NullPointerError;
class SessionExpiredError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.SessionExpiredError = SessionExpiredError;
class CPGroupDestroyedError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.CPGroupDestroyedError = CPGroupDestroyedError;
class LockOwnershipLostError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.LockOwnershipLostError = LockOwnershipLostError;
class IllegalMonitorStateError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.IllegalMonitorStateError = IllegalMonitorStateError;
class WaitKeyCancelledError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.WaitKeyCancelledError = WaitKeyCancelledError;
class LeaderDemotedError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.LeaderDemotedError = LeaderDemotedError;
class StaleAppendRequestError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.StaleAppendRequestError = StaleAppendRequestError;
class CannotReplicateError extends RetryableHazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.CannotReplicateError = CannotReplicateError;
class NotLeaderError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.NotLeaderError = NotLeaderError;
class UndefinedErrorCodeError extends HazelcastError {
    constructor(msg, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
    }
}
exports.UndefinedErrorCodeError = UndefinedErrorCodeError;
/**
 * An exception occurred during SQL query execution.
 */
class HazelcastSqlException extends HazelcastError {
    constructor(originatingMemberId, code, msg, suggestion = null, cause, serverStackTrace) {
        super(msg, cause, serverStackTrace);
        this.code = code;
        this.originatingMemberId = originatingMemberId;
        this.suggestion = suggestion;
    }
}
exports.HazelcastSqlException = HazelcastSqlException;
//# sourceMappingURL=HazelcastError.js.map