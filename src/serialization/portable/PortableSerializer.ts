/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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

import {SerializationService} from '../SerializationService';
import {PortableContext} from './PortableContext';
import {Portable, PortableFactory} from '../Serializable';
import {Serializer} from '../DefaultSerializer';
import {DataInput, PositionalDataOutput} from '../Data';
import {DefaultPortableReader} from './DefaultPortableReader';
import {MorphingPortableReader} from './MorphingPortableReader';
import {ClassDefinition, FieldType} from './ClassDefinition';
import {DefaultPortableWriter} from './DefaultPortableWriter';
import * as Long from 'long';
import {SerializationConfigImpl} from '../../config/SerializationConfig';
import {HazelcastSerializationError} from '../../HazelcastError';

export class PortableSerializer implements Serializer {

    id = -1;
    private portableContext: PortableContext;
    private factories: { [id: number]: PortableFactory };
    private service: SerializationService;

    constructor(service: SerializationService, serializationConfig: SerializationConfigImpl) {
        this.service = service;
        this.portableContext = new PortableContext(this.service, serializationConfig.portableVersion);
        this.factories = serializationConfig.portableFactories;
    }

    read(input: DataInput): any {
        const factoryId = input.readInt();
        const classId = input.readInt();
        return this.readObject(input, factoryId, classId);
    }

    readObject(input: DataInput, factoryId: number, classId: number): Portable {
        const version = input.readInt();

        const portable = this.createNewPortableInstance(factoryId, classId);
        let classDefinition = this.portableContext.lookupClassDefinition(factoryId, classId, version);
        if (classDefinition == null) {
            const backupPos = input.position();
            try {
                classDefinition = this.portableContext.readClassDefinitionFromInput(input, factoryId, classId, version);
            } finally {
                input.position(backupPos);
            }
        }
        let reader: DefaultPortableReader;
        if (classDefinition.getVersion() === this.portableContext.getClassVersion(portable)) {
            reader = new DefaultPortableReader(this, input, classDefinition);
        } else {
            reader = new MorphingPortableReader(this, input, classDefinition);
        }
        portable.readPortable(reader);
        reader.end();
        return portable;
    }

    write(output: PositionalDataOutput, object: Portable): void {
        output.writeInt(object.factoryId);
        output.writeInt(object.classId);

        this.writeObject(output, object);
    }

    writeObject(output: PositionalDataOutput, object: Portable): void {
        const cd: ClassDefinition = this.portableContext.lookupOrRegisterClassDefinition(object);

        output.writeInt(cd.getVersion());
        const writer = new DefaultPortableWriter(this, output, cd);
        object.writePortable(writer);
        writer.end();
    }

    private createNewPortableInstance(factoryId: number, classId: number): Portable {
        const factoryFn = this.factories[factoryId];
        if (factoryFn == null) {
            throw new HazelcastSerializationError(`There is no suitable portable factory for ${factoryId}.`);
        }
        const portable: Portable = factoryFn(classId);
        if (portable == null) {
            throw new HazelcastSerializationError(`Could not create Portable for class-id: ${classId}`);
        }
        return portable;
    }
}

export interface PortableWriter {
    writeInt(fieldName: string, value: number): void;

    writeLong(fieldName: string, long: Long): void;

    writeUTF(fieldName: string, str: string): void;

    writeBoolean(fieldName: string, value: boolean): void;

    writeByte(fieldName: string, value: number): void;

    writeChar(fieldName: string, char: string): void;

    writeDouble(fieldName: string, double: number): void;

    writeFloat(fieldName: string, float: number): void;

    writeShort(fieldName: string, value: number): void;

    writePortable(fieldName: string, portable: Portable): void;

    writeNullPortable(fieldName: string, factoryId: number, classId: number): void;

    writeByteArray(fieldName: string, bytes: number[]): void;

    writeBooleanArray(fieldName: string, booleans: boolean[]): void;

    writeCharArray(fieldName: string, chars: string[]): void;

    writeIntArray(fieldName: string, ints: number[]): void;

    writeLongArray(fieldName: string, longs: Long[]): void;

    writeDoubleArray(fieldName: string, doubles: number[]): void;

    writeFloatArray(fieldName: string, floats: number[]): void;

    writeShortArray(fieldName: string, shorts: number[]): void;

    writeUTFArray(fieldName: string, val: string[]): void;

    writePortableArray(fieldName: string, portables: Portable[]): void;
}

export interface PortableReader {
    getVersion(): number;

    hasField(fieldName: string): boolean;

    getFieldNames(): string[];

    getFieldType(fieldName: string): FieldType;

    readInt(fieldName: string): number;

    readLong(fieldName: string): Long;

    readUTF(fieldName: string): string;

    readBoolean(fieldName: string): boolean;

    readByte(fieldName: string): number;

    readChar(fieldName: string): string;

    readDouble(fieldName: string): number;

    readFloat(fieldName: string): number;

    readShort(fieldName: string): number;

    readPortable(fieldName: string): Portable;

    readByteArray(fieldName: string): number[];

    readBooleanArray(fieldName: string): boolean[];

    readCharArray(fieldName: string): string[];

    readIntArray(fieldName: string): number[];

    readLongArray(fieldName: string): Long[];

    readDoubleArray(fieldName: string): number[];

    readFloatArray(fieldName: string): number[];

    readShortArray(fieldName: string): number[];

    readUTFArray(fieldName: string): string[];

    readPortableArray(fieldName: string): Portable[];
}
