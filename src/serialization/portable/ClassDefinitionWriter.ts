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

import * as Long from 'long';
import * as Util from '../../Util';
import {Portable} from '../Serializable';
import {ClassDefinition, FieldDefinition, FieldType} from './ClassDefinition';
import {PortableContext} from './PortableContext';
import {PortableWriter} from './PortableSerializer';

export class ClassDefinitionWriter implements PortableWriter {
    private portableContext: PortableContext;
    private buildingDefinition: ClassDefinition;

    private index: number = 0;
    private factoryId: number;
    private classId: number;
    private version: number;
    private fieldDefinitions: { [fieldName: string]: FieldDefinition } = {};

    constructor(portableContext: PortableContext, factoryId: number, classId: number, version: number) {
        this.portableContext = portableContext;
        this.buildingDefinition = new ClassDefinition(factoryId, classId, version);
    }

    addFieldByType(fieldName: string, fieldType: FieldType, factoryId: number = 0, classId: number = 0) {
        this.fieldDefinitions[fieldName] = new FieldDefinition(this.index, fieldName, fieldType, factoryId, classId);
        this.index += 1;
    }

    writeInt(fieldName: string, value: number): void {
        this.addFieldByType(fieldName, FieldType.INT);
    }

    writeLong(fieldName: string, long: Long): void {
        this.addFieldByType(fieldName, FieldType.LONG);
    }

    writeUTF(fieldName: string, str: string): void {
        this.addFieldByType(fieldName, FieldType.UTF);
    }

    writeBoolean(fieldName: string, value: boolean): void {
        this.addFieldByType(fieldName, FieldType.BOOLEAN);
    }

    writeByte(fieldName: string, value: number): void {
        this.addFieldByType(fieldName, FieldType.BYTE);
    }

    writeChar(fieldName: string, char: string): void {
        this.addFieldByType(fieldName, FieldType.CHAR);
    }

    writeDouble(fieldName: string, double: number): void {
        this.addFieldByType(fieldName, FieldType.DOUBLE);
    }

    writeFloat(fieldName: string, float: number): void {
        this.addFieldByType(fieldName, FieldType.FLOAT);
    }

    writeShort(fieldName: string, value: number): void {
        this.addFieldByType(fieldName, FieldType.SHORT);
    }

    writePortable(fieldName: string, portable: Portable): void {
        Util.assertNotNull(portable);
        const nestedCD = this.portableContext.lookupOrRegisterClassDefinition(portable);
        this.addFieldByType(fieldName, FieldType.PORTABLE, nestedCD.getFactoryId(), nestedCD.getClassId());
    }

    writeNullPortable(fieldName: string, factoryId: number, classId: number): void {
        const version: number = 0;
        const nestedCD = this.portableContext.lookupClassDefinition(factoryId, classId, version);
        if (nestedCD == null) {
            throw new RangeError('Cannot write null portable without explicitly registering class definition!');
        }
        this.addFieldByType(fieldName, FieldType.PORTABLE, nestedCD.getFactoryId(), nestedCD.getClassId());
    }

    writeByteArray(fieldName: string, bytes: number[]): void {
        this.addFieldByType(fieldName, FieldType.BYTE_ARRAY);
    }

    writeBooleanArray(fieldName: string, booleans: boolean[]): void {
        this.addFieldByType(fieldName, FieldType.BOOLEAN_ARRAY);
    }

    writeCharArray(fieldName: string, chars: string[]): void {
        this.addFieldByType(fieldName, FieldType.CHAR_ARRAY);
    }

    writeIntArray(fieldName: string, ints: number[]): void {
        this.addFieldByType(fieldName, FieldType.INT_ARRAY);
    }

    writeLongArray(fieldName: string, longs: Long[]): void {
        this.addFieldByType(fieldName, FieldType.LONG_ARRAY);
    }

    writeDoubleArray(fieldName: string, doubles: number[]): void {
        this.addFieldByType(fieldName, FieldType.DOUBLE_ARRAY);
    }

    writeFloatArray(fieldName: string, floats: number[]): void {
        this.addFieldByType(fieldName, FieldType.FLOAT_ARRAY);
    }

    writeShortArray(fieldName: string, shorts: number[]): void {
        this.addFieldByType(fieldName, FieldType.SHORT_ARRAY);
    }

    writeUTFArray(fieldName: string, val: string[]): void {
        this.addFieldByType(fieldName, FieldType.UTF_ARRAY);
    }

    writePortableArray(fieldName: string, portables: Portable[]): void {
        Util.assertNotNull(portables);
        if (portables.length === 0) {
            throw new RangeError('Cannot write empty array!');
        }
        const sample = portables[0];
        const nestedCD = this.portableContext.lookupOrRegisterClassDefinition(sample);
        this.addFieldByType(fieldName, FieldType.PORTABLE_ARRAY, nestedCD.getFactoryId(), nestedCD.getClassId());
    }

    end(): void {
        for (const field in this.fieldDefinitions) {
            this.buildingDefinition.addFieldDefinition(this.fieldDefinitions[field]);
        }
    }

    getDefinition(): ClassDefinition {
        return this.buildingDefinition;
    }

    registerAndGet(): ClassDefinition {
        return this.portableContext.registerClassDefinition(this.buildingDefinition);
    }
}
