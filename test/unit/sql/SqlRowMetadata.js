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
const should = chai.should();
const { SqlRowMetadataImpl } = require('../../../lib/sql/SqlRowMetadata');
const { SqlColumnMetadataImpl } = require('../../../lib/sql/SqlColumnMetadata');
const { IllegalArgumentError } = require('../../../lib/core/HazelcastError');

describe('SqlRowMetadataTest', function () {
    describe('getColumnByIndex', function () {
       it('should return correct column', function () {
           const columnMetadata1 = {};
           const columnMetadata2 = {};

           const instance = new SqlRowMetadataImpl([columnMetadata1, columnMetadata2]);
           instance.getColumn(0).should.be.eq(columnMetadata1);
           instance.getColumn(1).should.be.eq(columnMetadata2);
           should.equal(instance.getColumn(3), undefined);
       });
    });
    describe('findColumn', function () {
        const instance = new SqlRowMetadataImpl([
            new SqlColumnMetadataImpl('foo', 0, true, true), new SqlColumnMetadataImpl('bar', 0, true, true)
        ]);

        it('should throw an error if non-string is passed', function () {
            [0, undefined, null, {}, [], BigInt(1), Symbol()].forEach(v => {
                (() => instance.findColumn(v)).should.throw(IllegalArgumentError, 'Expected string');
            });
        });

        it('should find columns', function () {
            instance.findColumn('foo').should.be.eq(0);
            instance.findColumn('bar').should.be.eq(1);
            instance.findColumn('unexisting-column').should.be.eq(-1);
        });
    });
});
