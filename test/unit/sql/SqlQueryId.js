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

const chai = require('chai');
chai.should();
const { SqlQueryId } = require('../../../lib/sql/SqlQueryId');
const { UuidUtil } = require('../../../lib/util/UuidUtil');
const sinon = require('sinon');

describe('SqlQueryIdTest', function () {
    describe('fromMemberId', function () {
        it('construct SqlQueryId correctly', function () {
            const memberUuid = UuidUtil.generate();
            const localUuid = UuidUtil.generate();

            const fake = sinon.replace(UuidUtil, 'generate', sinon.fake.returns(localUuid)); // mock random generation
            const staticInstance = SqlQueryId.fromMemberId(memberUuid);

            staticInstance.memberIdHigh.eq(memberUuid.mostSignificant).should.be.true;
            staticInstance.memberIdLow.eq(memberUuid.leastSignificant).should.be.true;
            staticInstance.localIdHigh.eq(localUuid.mostSignificant).should.be.true;
            staticInstance.localIdLow.eq(localUuid.leastSignificant).should.be.true;
            fake.calledOnce.should.be.true;
        });
    });
});
