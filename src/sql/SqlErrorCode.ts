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

/**
 * Error codes used in Hazelcast SQL.
 * @internal
 */
export class SqlErrorCode {
    /** Generic error. */
    static GENERIC = -1;
    /** A network connection problem between members, or between a client and a member. */
    static CONNECTION_PROBLEM = 1001;
    /** Query was cancelled due to user request. */
    static CANCELLED_BY_USER = 1003;
    /** Query was cancelled due to timeout. */
    static TIMEOUT = 1004;
    /** A problem with partition distribution. */
    static PARTITION_DISTRIBUTION = 1005;
    /** An error caused by a concurrent destroy of a map. */
    static MAP_DESTROYED = 1006;
    /** Map loading is not finished yet. */
    static MAP_LOADING_IN_PROGRESS = 1007;
    /** Generic parsing error. */
    static PARSING = 1008;
    /** An error caused by an attempt to query an index that is not valid. */
    static INDEX_INVALID = 1009;
    /** An error with data conversion or transformation. */
    static DATA_EXCEPTION = 2000;
}
