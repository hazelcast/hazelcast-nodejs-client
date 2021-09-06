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

const { SqlPage } = require('../../../lib/sql/SqlPage');
const { SqlColumnType } = require('../../../lib/sql/SqlColumnMetadata');
const chai = require('chai');
chai.should();

describe('SqlPageTest', function () {
    const columnTypes = [
        SqlColumnType.VARCHAR,
        SqlColumnType.VARCHAR
    ];

    const data = [
        ['a', 'c', 'e'], // holds one column
        ['b', 'd', 'f'], // holds another
    ];

    const isLast = true;

    const instance = new SqlPage(columnTypes, data, isLast);
    const staticInstance = SqlPage.fromColumns(columnTypes, data, isLast);

    describe('fromColumns', function () {
        it('should construct same page as new', function () {
            staticInstance.getRowCount().should.be.eq(instance.getRowCount());
            staticInstance.getColumnCount().should.be.eq(instance.getColumnCount());
            staticInstance.columns.should.be.eq(instance.columns);
            staticInstance.last.should.be.eq(instance.last);
        });
    });
    describe('getValue', function () {
        it('should give row values correctly', function () {
            instance.getValue(0, 0).should.be.eq('a');
            instance.getValue(0, 1).should.be.eq('b');
            instance.getValue(1, 0).should.be.eq('c');
            instance.getValue(2, 1).should.be.eq('f');
        });
    });
});
