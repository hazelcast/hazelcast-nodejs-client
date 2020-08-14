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

/** @internal */
export class ClientProtocolErrorCodes {
    static readonly UNDEFINED = 0;
    static readonly ARRAY_INDEX_OUT_OF_BOUNDS = 1;
    static readonly ARRAY_STORE = 2;
    static readonly AUTHENTICATION = 3;
    static readonly CACHE = 4;
    static readonly CACHE_LOADER = 5;
    static readonly CACHE_NOT_EXISTS = 6;
    static readonly CACHE_WRITER = 7;
    static readonly CALLER_NOT_MEMBER = 8;
    static readonly CANCELLATION = 9;
    static readonly CLASS_CAST = 10;
    static readonly CLASS_NOT_FOUND = 11;
    static readonly CONCURRENT_MODIFICATION = 12;
    static readonly CONFIG_MISMATCH = 13;
    static readonly DISTRIBUTED_OBJECT_DESTROYED = 14;
    static readonly EOF = 15;
    static readonly ENTRY_PROCESSOR = 16;
    static readonly EXECUTION = 17;
    static readonly HAZELCAST = 18;
    static readonly HAZELCAST_INSTANCE_NOT_ACTIVE = 19;
    static readonly HAZELCAST_OVERLOAD = 20;
    static readonly HAZELCAST_SERIALIZATION = 21;
    static readonly IO = 22;
    static readonly ILLEGAL_ARGUMENT = 23;
    static readonly ILLEGAL_ACCESS_EXCEPTION = 24;
    static readonly ILLEGAL_ACCESS_ERROR = 25;
    static readonly ILLEGAL_MONITOR_STATE = 26;
    static readonly ILLEGAL_STATE = 27;
    static readonly ILLEGAL_THREAD_STATE = 28;
    static readonly INDEX_OUT_OF_BOUNDS = 29;
    static readonly INTERRUPTED = 30;
    static readonly INVALID_ADDRESS = 31;
    static readonly INVALID_CONFIGURATION = 32;
    static readonly MEMBER_LEFT = 33;
    static readonly NEGATIVE_ARRAY_SIZE = 34;
    static readonly NO_SUCH_ELEMENT = 35;
    static readonly NOT_SERIALIZABLE = 36;
    static readonly NULL_POINTER = 37;
    static readonly OPERATION_TIMEOUT = 38;
    static readonly PARTITION_MIGRATING = 39;
    static readonly QUERY = 40;
    static readonly QUERY_RESULT_SIZE_EXCEEDED = 41;
    static readonly SPLIT_BRAIN_PROTECTION = 42;
    static readonly REACHED_MAX_SIZE = 43;
    static readonly REJECTED_EXECUTION = 44;
    static readonly RESPONSE_ALREADY_SENT = 45;
    static readonly RETRYABLE_HAZELCAST = 46;
    static readonly RETRYABLE_IO = 47;
    static readonly RUNTIME = 48;
    static readonly SECURITY = 49;
    static readonly SOCKET = 50;
    static readonly STALE_SEQUENCE = 51;
    static readonly TARGET_DISCONNECTED = 52;
    static readonly TARGET_NOT_MEMBER = 53;
    static readonly TIMEOUT = 54;
    static readonly TOPIC_OVERLOAD = 55;
    static readonly TRANSACTION = 56;
    static readonly TRANSACTION_NOT_ACTIVE = 57;
    static readonly TRANSACTION_TIMED_OUT = 58;
    static readonly URI_SYNTAX = 59;
    static readonly UTF_DATA_FORMAT = 60;
    static readonly UNSUPPORTED_OPERATION = 61;
    static readonly WRONG_TARGET = 62;
    static readonly XA = 63;
    static readonly ACCESS_CONTROL = 64;
    static readonly LOGIN = 65;
    static readonly UNSUPPORTED_CALLBACK = 66;
    static readonly NO_DATA_MEMBER = 67;
    static readonly REPLICATED_MAP_CANT_BE_CREATED = 68;
    static readonly MAX_MESSAGE_SIZE_EXCEEDED = 69;
    static readonly WAN_REPLICATION_QUEUE_FULL = 70;
    static readonly ASSERTION_ERROR = 71;
    static readonly OUT_OF_MEMORY_ERROR = 72;
    static readonly STACK_OVERFLOW_ERROR = 73;
    static readonly NATIVE_OUT_OF_MEMORY_ERROR = 74;
    static readonly SERVICE_NOT_FOUND = 75;
    static readonly STALE_TASK_ID = 76;
    static readonly DUPLICATE_TASK = 77;
    static readonly STALE_TASK = 78;
    static readonly LOCAL_MEMBER_RESET = 79;
    static readonly INDETERMINATE_OPERATION_STATE = 80;
    static readonly FLAKE_ID_NODE_ID_OUT_OF_RANGE_EXCEPTION = 81;
    static readonly TARGET_NOT_REPLICA_EXCEPTION = 82;
    static readonly MUTATION_DISALLOWED_EXCEPTION = 83;
    static readonly CONSISTENCY_LOST_EXCEPTION = 84;
    static readonly SESSION_EXPIRED_EXCEPTION = 85;
    static readonly WAIT_KEY_CANCELLED_EXCEPTION = 86;
    static readonly LOCK_ACQUIRE_LIMIT_REACHED_EXCEPTION = 87;
    static readonly LOCK_OWNERSHIP_LOST_EXCEPTION = 88;
    static readonly CP_GROUP_DESTROYED_EXCEPTION = 89;
    static readonly CANNOT_REPLICATE_EXCEPTION = 90;
    static readonly LEADER_DEMOTED_EXCEPTION = 91;
    static readonly STALE_APPEND_REQUEST_EXCEPTION = 92;
    static readonly NOT_LEADER_EXCEPTION = 93;
    static readonly VERSION_MISMATCH_EXCEPTION = 94;
}
