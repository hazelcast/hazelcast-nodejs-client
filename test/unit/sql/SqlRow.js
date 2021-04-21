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
const { SqlRowImpl } = require('../../../lib/sql/SqlRow');
const { IndexOutOfBoundsError, IllegalArgumentError } = require('../../../lib/core/HazelcastError');

describe('SqlRowTest', function () {
    const instance = new SqlRowImpl([
        {
            name: 'foo',
            value: 1
        },
        {
            name: 'bar',
            value: null
        }
    ], {});

    describe('getObject', function () {

        it('should give correct values', function () {
            expect(instance.getObject('foo')).to.be.eq(1);
            expect(instance.getObject('bar')).to.be.eq(null);
            expect(instance.getObject(0)).to.be.eq(1);
            expect(instance.getObject(1)).to.be.eq(null);

            expect(() => instance.getObject(2)).to.throw(IndexOutOfBoundsError, /Index .* does not exists/);
            expect(() => instance.getObject(-1)).to.throw(IndexOutOfBoundsError, /Index .* does not exists/);

            expect(() => instance.getObject('unexisted')).to.throw(IllegalArgumentError, /Could not find a column with name .*/);

            [undefined, [], BigInt(1), Symbol(), {}].forEach(invalidValue => {
                expect(() => instance.getObject(invalidValue)).to.throw(
                    IllegalArgumentError,
                    'Expected string or number for column argument'
                );
            });
        });
    });
});
