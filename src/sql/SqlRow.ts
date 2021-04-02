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


export interface SqlRow {
    /*
      Gets the value of the column by column index.
      The class of the returned value depends on the SQL type of the column. No implicit conversions are performed on the value.
      Throws exception if column specified with index does not exist.
    */

    getObject<T>(columnIndex: number): T;

    /*
      Gets the value of the column by column name.
      Throws error if column name is not found or columnName is not string.
    */

    getObject<T>(columnName: string): T;

    // Gets row metadata.
    getMetadata(): SqlRowMetadata;
}


