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

export interface SqlRowMetadata {

    // Gets the number of columns in the row.
    getColumnCount(): number;

    // Gets column metadata. Returns null if column is not found.
    getColumn(index: number): SqlColumnMetadata | null;

    // Gets columns metadata.
    getColumns(): SqlColumnMetadata[];

    /*
      Find index of the column with the given name. Returned index can be used to get column value from SqlRow.
      Exception is thrown if columnName is not string. If column is not found, -1 is returned.
    */
    findColumn(columnName: string): number;
}
