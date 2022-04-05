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
'use strict';

const chai = require('chai');
const should = chai.should();
const { SqlRowImpl } = require('../../../lib/sql/SqlRow');
const { SqlRowMetadataImpl } = require('../../../lib/sql/SqlRowMetadata');
const { SqlColumnType } = require('../../../lib/sql/SqlColumnMetadata');
const { IllegalArgumentError } = require('../../../lib/core/HazelcastError');

describe('SqlRowTest', function () {
    const fakeDeserializeFn = v => v;

    const instance = new SqlRowImpl([
        1, null
    ], new SqlRowMetadataImpl([{
        name: 'foo',
        type: SqlColumnType.BIGINT,
        nullable: true
    }, {
        name: 'bar',
        type: SqlColumnType.VARCHAR,
        nullable: true
    }]), fakeDeserializeFn);
    describe('getObject', function () {
        it('should give correct values', function () {
            instance.getObject('foo').should.be.eq(1);
            should.equal(instance.getObject('bar'), null);
            instance.getObject(0).should.be.eq(1);
            should.equal(instance.getObject(1), null);
            should.equal(instance.getObject(2), undefined);
            should.equal(instance.getObject(-1), undefined);

            (() => instance.getObject('unexisted')).should.throw(IllegalArgumentError, /Could not find a column with name .*/);

            [undefined, [], BigInt(1), Symbol(), {}].forEach(invalidValue => {
                (() => instance.getObject(invalidValue)).should.throw(
                    IllegalArgumentError,
                    'Expected string or number for column argument'
                );
            });
        });
    });
});
