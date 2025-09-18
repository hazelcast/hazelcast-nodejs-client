import { UUID } from './UUID';
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
export declare class HazelcastError extends Error {
    /**
     * Cause of this exception.
     */
    cause: Error;
    /**
     * Server-side stack trace.
     */
    serverStackTrace?: ServerErrorStackElement[];
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class HazelcastSerializationError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class AuthenticationError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class ClientNotActiveError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
/**
 * Thrown when the client can not use a cluster. Examples:
 * - Cluster blacklisted the client
 * - Cluster partition counts are different between alternative clusters
 */
export declare class ClientNotAllowedInClusterError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class ClientOfflineError extends HazelcastError {
    constructor(cause?: Error);
}
export declare class InvalidConfigurationError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class IllegalStateError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class InvocationMightContainCompactDataError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class StaleSequenceError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class TopicOverloadError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class IOError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class OperationTimeoutError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class RetryableHazelcastError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class TargetNotMemberError extends RetryableHazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class CallerNotMemberError extends RetryableHazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class CancellationError extends IllegalStateError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class ClassCastError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class ClassNotFoundError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class ConcurrentModificationError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class ConfigMismatchError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class DistributedObjectDestroyedError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class HazelcastInstanceNotActiveError extends IllegalStateError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class MemberLeftError extends RetryableHazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class PartitionMigratingError extends RetryableHazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class QueryError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class TransactionError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class TransactionNotActiveError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class TransactionTimedOutError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class SplitBrainProtectionError extends TransactionError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class RetryableIOError extends RetryableHazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class TargetDisconnectedError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class UnsupportedOperationError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class ConsistencyLostError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class NoDataMemberInClusterError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class StaleTaskIdError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class NodeIdOutOfRangeError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class ReachedMaxSizeError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class IndeterminateOperationStateError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class ArrayIndexOutOfBoundsError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class ArrayStoreError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class IllegalArgumentError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class IndexOutOfBoundsError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class InterruptedError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class InvalidAddressError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class NegativeArraySizeError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class NoSuchElementError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class NullPointerError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class SessionExpiredError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class CPGroupDestroyedError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class LockOwnershipLostError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class IllegalMonitorStateError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class WaitKeyCancelledError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class LeaderDemotedError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class StaleAppendRequestError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class CannotReplicateError extends RetryableHazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class NotLeaderError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
export declare class UndefinedErrorCodeError extends HazelcastError {
    constructor(msg: string, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
/**
 * An exception occurred during SQL query execution.
 */
export declare class HazelcastSqlException extends HazelcastError {
    private readonly code;
    /** Suggested SQL statement to remediate experienced error. */
    readonly suggestion: string | null;
    /**
     * ID of the member that caused or initiated an error condition.
     * This can be the client's UUID if error is due to the client.
     */
    readonly originatingMemberId: UUID;
    constructor(originatingMemberId: UUID, code: number, msg: string, suggestion?: string | null, cause?: Error, serverStackTrace?: ServerErrorStackElement[]);
}
