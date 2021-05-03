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

import {UUID} from '../core';
import {UuidUtil} from '../util/UuidUtil';
import * as Long from 'long';

/**
 * @internal
 *
 * Represents an individual query of the client. This is sent to server to identify the query. The query id is used
 * to fetch more pages or to close a query.
 * */
export class SqlQueryId {
    constructor(
        readonly memberIdHigh: Long,
        readonly memberIdLow: Long,
        readonly localIdHigh: Long,
        readonly localIdLow: Long
    ) {}

    static fromMemberId(memberId: UUID): SqlQueryId {
        const localId: UUID = UuidUtil.generate();
        return new SqlQueryId(
            memberId.mostSignificant,
            memberId.leastSignificant,
            localId.mostSignificant,
            localId.leastSignificant
        );
    }
}
