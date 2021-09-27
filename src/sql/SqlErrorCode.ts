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
/** @ignore *//** */

/**
 * Error codes used in Hazelcast SQL.
 * @internal
 */
export enum SqlErrorCode {
    /** Generic error. */
    GENERIC = -1,
    /** A network connection problem between members, or between a client and a member. */
    CONNECTION_PROBLEM = 1001,
    /** Query was cancelled due to user request. */
    CANCELLED_BY_USER = 1003,
    /** Query was cancelled due to timeout. */
    TIMEOUT = 1004,
    /** A problem with partition distribution. */
    PARTITION_DISTRIBUTION = 1005,
    /** Map loading is not finished yet. */
    MAP_LOADING_IN_PROGRESS = 1007,
    /** Generic parsing error. */
    PARSING = 1008,
    /** An error caused by an attempt to query an index that is not valid. */
    INDEX_INVALID = 1009,
    /** Object (mapping/table) not found. */
    OBJECT_NOT_FOUND = 1010,
    /** An error with data conversion or transformation. */
    DATA_EXCEPTION = 2000
}
