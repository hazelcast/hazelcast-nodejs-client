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
exports.SqlQueryId = void 0;
const UuidUtil_1 = require("../util/UuidUtil");
/**
 * @internal
 *
 * Represents an individual query of the client. This is sent to server to identify the query. The query id is used
 * to fetch more pages or to close a query.
 * */
class SqlQueryId {
    constructor(memberIdHigh, memberIdLow, localIdHigh, localIdLow) {
        this.memberIdHigh = memberIdHigh;
        this.memberIdLow = memberIdLow;
        this.localIdHigh = localIdHigh;
        this.localIdLow = localIdLow;
    }
    static fromMemberId(memberId) {
        const localId = UuidUtil_1.UuidUtil.generate();
        return new SqlQueryId(memberId.mostSignificant, memberId.leastSignificant, localId.mostSignificant, localId.leastSignificant);
    }
}
exports.SqlQueryId = SqlQueryId;
//# sourceMappingURL=SqlQueryId.js.map