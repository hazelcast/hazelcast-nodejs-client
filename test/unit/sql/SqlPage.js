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
const { expect } = require('chai');

describe('SqlPageTest', function () {

    const columnTypes = [
        SqlColumnType.VARCHAR,
        SqlColumnType.VARCHAR
    ];

    const data = [
        ['a', 'b'], // row
        ['c', 'd'], // another row
        ['e', 'f']
    ];

    const isLast = true;

    const instance = new SqlPage(columnTypes, data, isLast);
    const staticInstance = SqlPage.newPage(columnTypes, data, isLast);

    describe('newPage', function () {
        it('should construct same page as new', function () {
            expect(staticInstance.getRowCount()).to.be.eq(instance.getRowCount());
            expect(staticInstance.getColumnCount()).to.be.eq(instance.getColumnCount());
            expect(staticInstance.getColumnTypes()).to.be.eq(instance.getColumnTypes());
            expect(staticInstance.isLast()).to.be.eq(instance.isLast());
        });
    });

    describe('getValue', function () {
        it('should give row values correctly', function () {
            expect(instance.getValue(0, 0)).to.be.eq('a');
            expect(instance.getValue(0, 1)).to.be.eq('b');
            expect(instance.getValue(1, 0)).to.be.eq('c');
            expect(instance.getValue(2, 1)).to.be.eq('f');
        });
    });

});
