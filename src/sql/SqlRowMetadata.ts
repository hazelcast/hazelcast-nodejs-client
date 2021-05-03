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

import {SqlColumnMetadata} from './SqlColumnMetadata';
import {IllegalArgumentError} from '../core';

export interface SqlRowMetadata {

    /**
     * Gets the number of columns in the row.
     * @returns {number} Column count
     */
    getColumnCount(): number;

    /**
     *  Gets column metadata of column with given index.
     *  @returns {SqlColumnMetadata | null} SqlColumnMetadata of column with this index, null if column is not found.
     */
    getColumnByIndex(index: number): SqlColumnMetadata | undefined;

    /**
     *  Gets columns metadata.
     *  @returns {SqlColumnMetadata[]} This row's columns' metadata.
     */
    getColumns(): SqlColumnMetadata[];

    /**
     * Find index of the column with the given name. Returned index can be used to get column value from SqlRow.
     * @returns {number} Column index. If column is not found, -1 is returned.
     * @throws {@link IllegalArgumentError} is thrown if columnName is not string.
     */
    findColumn(columnName: string): number;
}

/** @internal */
export class SqlRowMetadataImpl implements SqlRowMetadata {
    private readonly columns: SqlColumnMetadata[];
    private static readonly COLUMN_NOT_FOUND = -1
    private readonly nameToIndex: { [key: string]: number };

    constructor(columns: SqlColumnMetadata[]) {
        this.columns = columns;
        this.nameToIndex = {};
        for (let i = 0; i < columns.length; i++) {
            this.nameToIndex[columns[i].name] = i;
        }
    }

    getColumnCount(): number {
        return this.columns.length;
    }

    getColumnByIndex(index: number): SqlColumnMetadata | undefined {
        return this.columns[index];
    }

    getColumns(): SqlColumnMetadata[] {
        return this.columns;
    }


    findColumn(columnName: string): number {
        if (typeof columnName !== 'string') {
            throw new IllegalArgumentError(`Expected string got type ${typeof columnName}`);
        }
        const columnIndex = this.nameToIndex[columnName];
        return columnIndex !== undefined ? columnIndex : SqlRowMetadataImpl.COLUMN_NOT_FOUND;
    }
}

