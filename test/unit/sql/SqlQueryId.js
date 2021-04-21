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
'use strict';

const { expect } = require('chai');
const { SqlQueryId } = require('../../../lib/sql/SqlQueryId');
const { UuidUtil } = require('../../../lib/util/UuidUtil');
const long = require('long');

describe('SqlQueryIdTest', function () {
    const uuid = UuidUtil.generate();
    const staticInstance = SqlQueryId.fromMemberId(uuid);

    describe('fromMemberId', function () {
        it('construct SqlQueryId correctly', function () {
            expect(staticInstance.memberIdHigh.eq(uuid.mostSignificant)).to.be.true;
            expect(staticInstance.memberIdLow.eq(uuid.leastSignificant)).to.be.true;
            // local uuid is random uuid
            expect(long.isLong(staticInstance.localIdHigh)).to.be.true;
            expect(long.isLong(staticInstance.localIdLow)).to.be.true;
        });
    });
});
