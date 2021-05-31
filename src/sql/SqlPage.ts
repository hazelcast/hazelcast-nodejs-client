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

import {SqlColumnType} from './SqlColumnMetadata';

/** @internal */
export class SqlPage {
    constructor(
        private readonly columnTypes: SqlColumnType[],
        /*
         The first index is column index, the second one is row index. This is chosen this way because server sends
         SQL pages in columnar format. If row based data was used, additional conversion is necessary.
         */
        private readonly columns: any[][],
        public readonly last: boolean
    ) {
    }

    /**
     * Row count is the number of items in the first column
     */
    getRowCount(): number {
        return this.columns[0].length;
    }

    /**
     * Since we store data in columnar format, column count is equal to number of items in the data. Alternatively,
     * columnTypes array can be used.
     */
    getColumnCount(): number {
        return this.columnTypes.length;
    }

    /**
     * @returns the value in certain row and column
     */
    getValue(rowIndex: number, columnIndex: number): any {
        return this.columns[columnIndex][rowIndex];
    }

    /**
     * This is needed for better mocking. Constructor mocking is not trivial with sinon.
     */
    static fromColumns(columnTypes: SqlColumnType[], columns: any[][], last: boolean): SqlPage {
        return new SqlPage(columnTypes, columns, last);
    }
}
