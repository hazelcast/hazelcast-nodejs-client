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
import {SqlRowMetadata} from './SqlRowMetadata';
import {IllegalArgumentError, IndexOutOfBoundsError} from '../core';

export interface SqlRow {

    /**
     Gets the value of the column by column index or column name.
     The class of the returned value depends on the SQL type of the column. See {@link SqlColumnType}
     @param columnNameOrIndex Column name or index
     @returns value in specified column of this row
     @throws {@link IllegalArgumentError} if columnNameOrIndex is string and column specified with name does not exist
     @throws {@link IndexOutOfBoundsError} if columnNameOrIndex is number and there is no index with its value
     @throws {@link IllegalArgumentError} if columnNameOrIndex is not string or number
     */
    getObject<T>(columnNameOrIndex: string | number): T;

    /**
     * Get row metadata of this row.
     * @returns row metadata
     */
    getMetadata(): SqlRowMetadata;

}

/** @internal */
export interface NamedRowValue {
    value: any,
    name: string
}

/** @internal */
export class SqlRowImpl implements SqlRow {

    constructor(private readonly namedValues: NamedRowValue[], private readonly rowMetadata: SqlRowMetadata) {
    }

    getObject<T>(columnNameOrIndex: string | number): T {
        if (typeof columnNameOrIndex === 'number') {
            if (columnNameOrIndex < 0 || columnNameOrIndex >= this.namedValues.length) {
                throw new IndexOutOfBoundsError(`Index ${columnNameOrIndex} does not exists.`);
            }
            return this.namedValues[columnNameOrIndex].value;
        } else if (typeof columnNameOrIndex === 'string') {
            for (const value of this.namedValues) {
                if (value.name === columnNameOrIndex) {
                    return value.value;
                }
            }
            throw new IllegalArgumentError(`Could not find a column with name ${columnNameOrIndex}`);
        } else {
            throw new IllegalArgumentError('Expected string or number for column argument');
        }
    }

    getMetadata(): SqlRowMetadata {
        return this.rowMetadata;
    }

}
