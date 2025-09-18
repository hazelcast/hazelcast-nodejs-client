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
exports.SqlErrorCode = void 0;
/**
 * Error codes used in Hazelcast SQL.
 * @internal
 */
var SqlErrorCode;
(function (SqlErrorCode) {
    /** Generic error. */
    SqlErrorCode[SqlErrorCode["GENERIC"] = -1] = "GENERIC";
    /** A network connection problem between members, or between a client and a member. */
    SqlErrorCode[SqlErrorCode["CONNECTION_PROBLEM"] = 1001] = "CONNECTION_PROBLEM";
    /** Query was cancelled due to user request. */
    SqlErrorCode[SqlErrorCode["CANCELLED_BY_USER"] = 1003] = "CANCELLED_BY_USER";
    /** Query was cancelled due to timeout. */
    SqlErrorCode[SqlErrorCode["TIMEOUT"] = 1004] = "TIMEOUT";
    /** A problem with partition distribution. */
    SqlErrorCode[SqlErrorCode["PARTITION_DISTRIBUTION"] = 1005] = "PARTITION_DISTRIBUTION";
    /** Map loading is not finished yet. */
    SqlErrorCode[SqlErrorCode["MAP_LOADING_IN_PROGRESS"] = 1007] = "MAP_LOADING_IN_PROGRESS";
    /** Generic parsing error. */
    SqlErrorCode[SqlErrorCode["PARSING"] = 1008] = "PARSING";
    /** An error caused by an attempt to query an index that is not valid. */
    SqlErrorCode[SqlErrorCode["INDEX_INVALID"] = 1009] = "INDEX_INVALID";
    /** Object (mapping/table) not found. */
    SqlErrorCode[SqlErrorCode["OBJECT_NOT_FOUND"] = 1010] = "OBJECT_NOT_FOUND";
    /** An error with data conversion or transformation. */
    SqlErrorCode[SqlErrorCode["DATA_EXCEPTION"] = 2000] = "DATA_EXCEPTION";
})(SqlErrorCode = exports.SqlErrorCode || (exports.SqlErrorCode = {}));
//# sourceMappingURL=SqlErrorCode.js.map