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

    const columnMetadataList = [
        SqlColumnType.VARCHAR,
        SqlColumnType.VARCHAR
    ];

    const data = [
        ['a', 'b'], // row
        ['c', 'd'], // another row
        ['e', 'f']
    ];

    const isLast = true;

    const instance = new SqlPage(columnMetadataList, data, isLast);
    const staticInstance = SqlPage.newPage(columnMetadataList, data, isLast);

    it('should have working getters', function () {
        expect(instance.getRowCount()).to.be.eq(3);
        expect(instance.getColumnCount()).to.be.eq(2);
        expect(instance.getColumnTypes()).to.be.eq(columnMetadataList);
        expect(instance.isLast()).to.be.true;
    });

    it('should have working getters for the instance created using newPage', function () {
        expect(staticInstance.getRowCount()).to.be.eq(3);
        expect(staticInstance.getColumnCount()).to.be.eq(2);
        expect(staticInstance.getColumnTypes()).to.be.eq(columnMetadataList);
        expect(staticInstance.isLast()).to.be.true;
    });

    it('should be able to getValue by row, column indices', function () {
        expect(instance.getValue(0, 0)).to.be.eq('a');
        expect(instance.getValue(0, 1)).to.be.eq('b');
        expect(instance.getValue(1, 0)).to.be.eq('c');
        expect(instance.getValue(2, 1)).to.be.eq('f');
    });
});
