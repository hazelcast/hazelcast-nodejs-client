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
const { SqlRowMetadataImpl } = require('../../../lib/sql/SqlRowMetadata');
const { SqlColumnMetadataImpl } = require('../../../lib/sql/SqlColumnMetadata');
const { IllegalArgumentError, IllegalStateError } = require('../../../lib/core/HazelcastError');

describe('SqlRowMetadataTest', function () {

    describe('constructor', function () {
        it('should throw on non-array columns argument, or an empty array', function () {
            [undefined, [], '', 1, BigInt(1), Symbol(), {}].forEach(invalidColumnValue => {
                expect(() => new SqlRowMetadataImpl(invalidColumnValue)).to.throw(IllegalStateError, 'Invalid columns given');
            });
        });
    });

    describe('getColumnByIndex', function () {
       it('should return correct column', function () {
           const columnMetadata1 = {};
           const columnMetadata2 = {};

           const instance = new SqlRowMetadataImpl([columnMetadata1, columnMetadata2]);
           expect(instance.getColumnByIndex(0)).to.be.eq(columnMetadata1);
           expect(instance.getColumnByIndex(1)).to.be.eq(columnMetadata2);
           expect(instance.getColumnByIndex(3)).to.be.eq(undefined);
       });
    });

    describe('findColumn', function () {
        const instance = new SqlRowMetadataImpl([
            new SqlColumnMetadataImpl('foo', 0, true, true), new SqlColumnMetadataImpl('bar', 0, true, true)
        ]);

        it('should throw an error if non-string is passed', function () {
            [0, undefined, null, {}, [], BigInt(1), Symbol()].forEach(v => {
                expect(() => instance.findColumn(v)).to.throw(IllegalArgumentError, 'Expected string');
            });
        });

        it('should find columns', function () {
            expect(instance.findColumn('foo')).to.be.eq(0);
            expect(instance.findColumn('bar')).to.be.eq(1);
            expect(instance.findColumn('unexisting-column')).to.be.eq(-1);
        });
    });
});
