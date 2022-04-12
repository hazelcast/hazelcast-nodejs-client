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
/** @ignore *//** */

import { CompactReader } from '../compact';
import {DefaultCompactWriter} from '../compact/DefaultCompactWriter';
import {GenericRecord} from './GenericRecord';

/**
 * Every FieldKind should support these operations used across the code base. Used in compact
 * code base.
 * @internal
 */
export interface FieldKindBasedOperations {
    /**
     * Writes a field from a generic record to a writer
     */
    writeFieldFromRecordToWriter(writer: DefaultCompactWriter, genericRecord: GenericRecord, fieldName: string) : void;
    /**
     * Returns byte size of a field kind.
     */
    kindSizeInBytes(): number;

    /**
     * Reads a field from reader.
     */
    readFromReader(reader: CompactReader, fieldName: string): any;

    /**
     * Validates a field
     * @param value field value
     */
     validateField(
        fieldName: string,
        value: any,
        getErrorStringFn: (fieldName: string, typeName: string, value: any) => string,
    ): void;
}
