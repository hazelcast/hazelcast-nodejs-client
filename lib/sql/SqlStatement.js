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
exports.SqlExpectedResultType = void 0;
/**
 * The expected statement result type.
 */
var SqlExpectedResultType;
(function (SqlExpectedResultType) {
    /** The statement may produce either rows or an update count. */
    SqlExpectedResultType[SqlExpectedResultType["ANY"] = 0] = "ANY";
    /** The statement must produce rows. An exception is thrown if the statement produces an update count. */
    SqlExpectedResultType[SqlExpectedResultType["ROWS"] = 1] = "ROWS";
    /** The statement must produce an update count. An exception is thrown if the statement produces rows. */
    SqlExpectedResultType[SqlExpectedResultType["UPDATE_COUNT"] = 2] = "UPDATE_COUNT";
})(SqlExpectedResultType = exports.SqlExpectedResultType || (exports.SqlExpectedResultType = {}));
//# sourceMappingURL=SqlStatement.js.map