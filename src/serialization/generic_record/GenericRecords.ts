/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
import {GenericRecord} from './GenericRecord';
import {CompactGenericRecordImpl} from './CompactGenericRecord';
import {Field} from './Fields';

/**
 * The class for creating generic records. This class should not be instantiated directly.
 * Its {@link compact} method creates new compact generic records.
 *
 */
export class GenericRecords {
    /**
     * Static constructor method for compact generic records.
     *
     * @param typeName Represents the type of the compact object, included in serialized form
     * @param fields Represents the field schema of the compact
     * @param values Values to use in the generic record. This should be in sync with {@link fields}
     * @throws TypeError if a value is of wrong type according to {@link fields}
     * @throws RangeError if a value is out of range of its type
     * @returns A compact generic record
     */
    static compact<F extends {[name: string]: Field<any>}>(
        typeName: string,
        fields: F,
        values: {[property in keyof F]: F[property] extends Field<infer T> ? T : any}
    ): GenericRecord {
        return new CompactGenericRecordImpl(typeName, fields, values);
    }
}
