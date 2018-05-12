/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
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

import {PortableReader, PortableSerializer} from './PortableSerializer';
import {DataInput} from '../Data';
import {ClassDefinition, FieldDefinition, FieldType} from './ClassDefinition';
import {BitsUtil} from '../../BitsUtil';
import {Portable} from '../Serializable';
import * as Long from 'long';
import {IllegalStateError} from '../../HazelcastError';

export class DefaultPortableReader implements PortableReader {

    protected serializer: PortableSerializer;
    protected input: DataInput;
    protected classDefinition: ClassDefinition;

    private offset: number;
    private finalPos: number;
    private raw: boolean = false;

    constructor(serializer: PortableSerializer, input: DataInput, classDefinition: ClassDefinition) {
        this.serializer = serializer;
        this.input = input;
        this.classDefinition = classDefinition;

        this.finalPos = this.input.readInt();
        var fieldCount = this.input.readInt();
        this.offset = this.input.position();
    }

    getVersion(): number {
        return this.classDefinition.getVersion();
    }

    hasField(fieldName: string): boolean {
        return this.classDefinition.hasField(fieldName);
    }

    getFieldNames(): string[] {
        throw new ReferenceError('Not implemented!');
    }

    getFieldType(fieldName: string): FieldType {
        return this.classDefinition.getFieldType(fieldName);
    }

    readInt(fieldName: string): number {
        var pos = this.positionByField(fieldName, FieldType.INT);
        return this.input.readInt(pos);
    }

    readLong(fieldName: string): Long {
        var pos = this.positionByField(fieldName, FieldType.LONG);
        return this.input.readLong(pos);
    }

    readUTF(fieldName: string): string {
        var pos = this.positionByField(fieldName, FieldType.UTF);
        return this.input.readUTF(pos);
    }

    readBoolean(fieldName: string): boolean {
        var pos = this.positionByField(fieldName, FieldType.BOOLEAN);
        return this.input.readBoolean(pos);
    }

    readByte(fieldName: string): number {
        var pos = this.positionByField(fieldName, FieldType.BYTE);
        return this.input.readByte(pos);
    }

    readChar(fieldName: string): string {
        var pos = this.positionByField(fieldName, FieldType.CHAR);
        return this.input.readChar(pos);
    }

    readDouble(fieldName: string): number {
        var pos = this.positionByField(fieldName, FieldType.DOUBLE);
        return this.input.readDouble(pos);
    }

    readFloat(fieldName: string): number {
        var pos = this.positionByField(fieldName, FieldType.FLOAT);
        return this.input.readFloat(pos);
    }

    readShort(fieldName: string): number {
        var pos = this.positionByField(fieldName, FieldType.SHORT);
        return this.input.readShort(pos);
    }

    readPortable(fieldName: string): Portable {
        var backupPos = this.input.position();
        try {
            var pos = this.positionByField(fieldName, FieldType.PORTABLE);
            this.input.position(pos);
            var isNull = this.input.readBoolean();
            var factoryId = this.input.readInt();
            var classId = this.input.readInt();
            if (isNull) {
                return null;
            } else {
                return this.serializer.readObject(this.input, factoryId, classId);
            }
        } finally {
            this.input.position(backupPos);
        }
    }

    readByteArray(fieldName: string): number[] {
        var pos = this.positionByField(fieldName, FieldType.BYTE_ARRAY);
        return this.input.readByteArray(pos);
    }

    readBooleanArray(fieldName: string): boolean[] {
        var pos = this.positionByField(fieldName, FieldType.BOOLEAN_ARRAY);
        return this.input.readBooleanArray(pos);
    }

    readCharArray(fieldName: string): string[] {
        var pos = this.positionByField(fieldName, FieldType.CHAR_ARRAY);
        return this.input.readCharArray(pos);
    }

    readIntArray(fieldName: string): number[] {
        var pos = this.positionByField(fieldName, FieldType.INT_ARRAY);
        return this.input.readIntArray(pos);
    }

    readLongArray(fieldName: string): Long[] {
        var pos = this.positionByField(fieldName, FieldType.LONG_ARRAY);
        return this.input.readLongArray(pos);
    }

    readDoubleArray(fieldName: string): number[] {
        var pos = this.positionByField(fieldName, FieldType.DOUBLE_ARRAY);
        return this.input.readDoubleArray(pos);
    }

    readFloatArray(fieldName: string): number[] {
        var pos = this.positionByField(fieldName, FieldType.FLOAT_ARRAY);
        return this.input.readFloatArray(pos);
    }

    readShortArray(fieldName: string): number[] {
        var pos = this.positionByField(fieldName, FieldType.SHORT_ARRAY);
        return this.input.readShortArray(pos);
    }

    readUTFArray(fieldName: string): string[] {
        var pos = this.positionByField(fieldName, FieldType.UTF_ARRAY);
        return this.input.readUTFArray(pos);
    }

    readPortableArray(fieldName: string): Portable[] {
        var backupPos = this.input.position();
        try {
            var pos = this.positionByField(fieldName, FieldType.PORTABLE_ARRAY);
            this.input.position(pos);
            var len = this.input.readInt();
            var factoryId = this.input.readInt();
            var classId = this.input.readInt();
            if (len === BitsUtil.NULL_ARRAY_LENGTH) {
                return null;
            } else {
                var portables: Portable[] = [];
                if (len > 0) {
                    var offset = this.input.position();
                    for (var i = 0; i < len; i++) {
                        var start = this.input.readInt(offset + i * BitsUtil.INT_SIZE_IN_BYTES);
                        this.input.position(start);
                        portables[i] = this.serializer.readObject(this.input, factoryId, classId);
                    }
                }
                return portables;
            }
        } finally {
            this.input.position(backupPos);
        }
    }

    getRawDataInput(): DataInput {
        var pos: number;
        if (!this.raw) {
            pos = this.input.readInt(this.offset + this.classDefinition.getFieldCount() * BitsUtil.INT_SIZE_IN_BYTES);
            this.input.position(pos);
            this.raw = true;
        }
        return this.input;
    }

    end() {
        this.input.position(this.finalPos);
    }

    private positionByFieldDefinition(field: FieldDefinition): number {
        if (this.raw) {
            throw new IllegalStateError('Cannot read portable fields after getRawDataInput called!');
        }
        var pos = this.input.readInt(this.offset + field.getIndex() * BitsUtil.INT_SIZE_IN_BYTES);
        var len = this.input.readShort(pos);
        return pos + BitsUtil.SHORT_SIZE_IN_BYTES + len + 1;
    }

    private positionByField(fieldName: string, fieldType: FieldType): number {
        var definition = this.classDefinition.getField(fieldName);
        return this.positionByFieldDefinition(definition);
    }
}
