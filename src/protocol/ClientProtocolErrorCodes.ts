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
    static readonly CONFIGURATION = 14;
    static readonly DISTRIBUTED_OBJECT_DESTROYED = 15;
    static readonly DUPLICATE_INSTANCE_NAME = 16;
    static readonly EOF = 17;
    static readonly ENTRY_PROCESSOR = 18;
    static readonly EXECUTION = 19;
    static readonly HAZELCAST = 20;
    static readonly HAZELCAST_INSTANCE_NOT_ACTIVE = 21;
    static readonly HAZELCAST_OVERLOAD = 22;
    static readonly HAZELCAST_SERIALIZATION = 23;
    static readonly IO = 24;
    static readonly ILLEGAL_ARGUMENT = 25;
    static readonly ILLEGAL_ACCESS_EXCEPTION = 26;
    static readonly ILLEGAL_ACCESS_ERROR = 27;
    static readonly ILLEGAL_MONITOR_STATE = 28;
    static readonly ILLEGAL_STATE = 29;
    static readonly ILLEGAL_THREAD_STATE = 30;
    static readonly INDEX_OUT_OF_BOUNDS = 31;
    static readonly INTERRUPTED = 32;
    static readonly INVALID_ADDRESS = 33;
    static readonly INVALID_CONFIGURATION = 34;
    static readonly MEMBER_LEFT = 35;
    static readonly NEGATIVE_ARRAY_SIZE = 36;
    static readonly NO_SUCH_ELEMENT = 37;
    static readonly NOT_SERIALIZABLE = 38;
    static readonly NULL_POINTER = 39;
    static readonly OPERATION_TIMEOUT = 40;
    static readonly PARTITION_MIGRATING = 41;
    static readonly QUERY = 42;
    static readonly QUERY_RESULT_SIZE_EXCEEDED = 43;
    static readonly QUORUM = 44;
    static readonly REACHED_MAX_SIZE = 45;
    static readonly REJECTED_EXECUTION = 46;
    static readonly REMOTE_MAP_REDUCE = 47;
    static readonly RESPONSE_ALREADY_SENT = 48;
    static readonly RETRYABLE_HAZELCAST = 49;
    static readonly RETRYABLE_IO = 50;
    static readonly RUNTIME = 51;
    static readonly SECURITY = 52;
    static readonly SOCKET = 53;
    static readonly STALE_SEQUENCE = 54;
    static readonly TARGET_DISCONNECTED = 55;
    static readonly TARGET_NOT_MEMBER = 56;
    static readonly TIMEOUT = 57;
    static readonly TOPIC_OVERLOAD = 58;
    static readonly TOPOLOGY_CHANGED = 59;
    static readonly TRANSACTION = 60;
    static readonly TRANSACTION_NOT_ACTIVE = 61;
    static readonly TRANSACTION_TIMED_OUT = 62;
    static readonly URI_SYNTAX = 63;
    static readonly UTF_DATA_FORMAT = 64;
    static readonly UNSUPPORTED_OPERATION = 65;
    static readonly WRONG_TARGET = 66;
    static readonly XA = 67;
    static readonly ACCESS_CONTROL = 68;
    static readonly LOGIN = 69;
    static readonly UNSUPPORTED_CALLBACK = 70;
    static readonly NO_DATA_MEMBER = 71;
    static readonly REPLICATED_MAP_CANT_BE_CREATED = 72;
    static readonly MAX_MESSAGE_SIZE_EXCEEDED = 73;
    static readonly WAN_REPLICATION_QUEUE_FULL = 74;
    static readonly ASSERTION_ERROR = 75;
    static readonly OUT_OF_MEMORY_ERROR = 76;
    static readonly STACK_OVERFLOW_ERROR = 77;
    static readonly NATIVE_OUT_OF_MEMORY_ERROR = 78;
    static readonly SERVICE_NOT_FOUND = 79;
    static readonly STALE_TASK_ID = 80;
    static readonly DUPLICATE_TASK = 81;
    static readonly STALE_TASK = 82;
    static readonly LOCAL_MEMBER_RESET = 83;
    static readonly INDETERMINATE_OPERATION_STATE = 84;
    static readonly FLAKE_ID_NODE_ID_OUT_OF_RANGE_EXCEPTION = 85;
    static readonly TARGET_NOT_REPLICA_EXCEPTION = 86;
    static readonly MUTATION_DISALLOWED_EXCEPTION = 87;
    static readonly CONSISTENCY_LOST_EXCEPTION = 88;
}
