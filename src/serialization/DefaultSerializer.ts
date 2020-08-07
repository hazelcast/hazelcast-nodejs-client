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

import Long = require('long');
import {BitsUtil} from '../BitsUtil';
import {DataInput, DataOutput} from './Data';
import {IdentifiedDataSerializable, IdentifiedDataSerializableFactory} from './Serializable';
import {HazelcastJsonValue} from '../core/HazelcastJsonValue';

/**
 * Defines common interface for default and custom serializers.
 */
export interface Serializer<T = any> {

    /**
     * Type id.
     */
    id: number;

    /**
     * Deserializes input data into an object.
     *
     * @param input input data reader
     */
    read(input: DataInput): T;

    /**
     * Serializes an object into binary data.
     *
     * @param output output data writer
     * @param object object to be serialized
     */
    write(output: DataOutput, object: T): void;

}

export class StringSerializer implements Serializer {

    id = -11;

    read(input: DataInput): any {
        return input.readUTF();
    }

    write(output: DataOutput, object: any): void {
        output.writeUTF(object);
    }
}

export class DoubleSerializer implements Serializer {

    id = -10;

    read(input: DataInput): any {
        return input.readDouble();
    }

    write(output: DataOutput, object: any): void {
        output.writeDouble(object);
    }
}

export class BooleanSerializer implements Serializer {

    id = -4;

    read(input: DataInput): any {
        return input.readBoolean();
    }

    write(output: DataOutput, object: any): void {
        output.writeBoolean(object);
    }
}

export const NULL_TYPE_ID = 0;

export class NullSerializer implements Serializer {

    id = NULL_TYPE_ID;

    read(input: DataInput): any {
        return null;
    }

    write(output: DataOutput, object: any): void {
        // Empty method
    }
}

export class ShortSerializer implements Serializer {

    id = -6;

    read(input: DataInput): any {
        return input.readShort();
    }

    write(output: DataOutput, object: any): void {
        output.writeShort(object);
    }
}

export class IntegerSerializer implements Serializer {

    id = -7;

    read(input: DataInput): any {
        return input.readInt();
    }

    write(output: DataOutput, object: any): void {
        output.writeInt(object);
    }
}

export class LongSerializer implements Serializer {

    id = -8;

    read(input: DataInput): any {
        return input.readLong();
    }

    write(output: DataOutput, object: any): void {
        output.writeLong(object);
    }
}

export class FloatSerializer implements Serializer {

    id = -9;

    read(input: DataInput): any {
        return input.readFloat();
    }

    write(output: DataOutput, object: any): void {
        output.writeFloat(object);
    }
}

export class DateSerializer implements Serializer {

    id = -25;

    read(input: DataInput): any {
        return new Date(input.readLong().toNumber());
    }

    write(output: DataOutput, object: any): void {
        output.writeLong(Long.fromNumber(object.getMilliseconds()));
    }
}

export class BooleanArraySerializer implements Serializer {

    id = -13;

    read(input: DataInput): any {
        return input.readBooleanArray();
    }

    write(output: DataOutput, object: any): void {
        output.writeBooleanArray(object);
    }
}

export class ShortArraySerializer implements Serializer {

    id = -15;

    read(input: DataInput): any {
        return input.readShortArray();
    }

    write(output: DataOutput, object: any): void {
        output.writeShortArray(object);
    }
}

export class IntegerArraySerializer implements Serializer {

    id = -16;

    read(input: DataInput): any {
        return input.readIntArray();
    }

    write(output: DataOutput, object: any): void {
        output.writeIntArray(object);
    }
}

export class LongArraySerializer implements Serializer {

    id = -17;

    read(input: DataInput): any {
        return input.readLongArray();
    }

    write(output: DataOutput, object: any): void {
        output.writeLongArray(object);
    }
}

export class DoubleArraySerializer implements Serializer {

    id = -19;

    read(input: DataInput): any {
        return input.readDoubleArray();
    }

    write(output: DataOutput, object: any): void {
        output.writeDoubleArray(object);
    }
}

export class StringArraySerializer implements Serializer {

    id = -20;

    read(input: DataInput): any {
        return input.readUTFArray();
    }

    write(output: DataOutput, object: any): void {
        output.writeUTFArray(object);
    }
}

export class ByteSerializer implements Serializer {

    id = -3;

    read(input: DataInput): any {
        return input.readByte();
    }

    write(output: DataOutput, object: any): void {
        output.writeByte(object);
    }
}

export class ByteArraySerializer implements Serializer {

    id = -12;

    read(input: DataInput): any {
        return input.readByteArray();
    }

    write(output: DataOutput, object: any): void {
        output.writeByteArray(object);
    }
}

export class CharSerializer implements Serializer {

    id = -5;

    read(input: DataInput): any {
        return input.readChar();
    }

    write(output: DataOutput, object: any): void {
        output.writeChar(object);
    }
}

export class CharArraySerializer implements Serializer {

    id = -14;

    read(input: DataInput): any {
        return input.readCharArray();
    }

    write(output: DataOutput, object: any): void {
        output.writeCharArray(object);
    }
}

export class FloatArraySerializer implements Serializer {

    id = -18;

    read(input: DataInput): any {
        return input.readFloatArray();
    }

    write(output: DataOutput, object: any): void {
        output.writeFloatArray(object);
    }
}

export class JavaClassSerializer implements Serializer {

    id = -24;

    read(input: DataInput): any {
        return input.readUTF();
    }

    write(output: DataOutput, object: any): void {
        output.writeUTF(object);
    }
}

export class LinkedListSerializer implements Serializer {

    id = -30;

    read(input: DataInput): any {
        const size = input.readInt();
        let result: any = null;
        if (size > BitsUtil.NULL_ARRAY_LENGTH) {
            result = [];
            for (let i = 0; i < size; i++) {
                result.push(input.readObject());
            }
        }
        return result;
    }

    write(output: DataOutput, object: any): void {
        // no-op
    }
}

export class ArrayListSerializer extends LinkedListSerializer {

    id = -29;
}

export class IdentifiedDataSerializableSerializer implements Serializer {

    id = -2;
    private factories: { [id: number]: IdentifiedDataSerializableFactory };

    constructor(factories: { [id: number]: IdentifiedDataSerializableFactory }) {
        this.factories = factories;
    }

    read(input: DataInput): any {
        const isIdentified = input.readBoolean();
        if (!isIdentified) {
            throw new RangeError('Native clients does not support Data Serializable. Please use Identified Data Serializable');
        }
        const factoryId = input.readInt();
        const classId = input.readInt();
        const factoryFn = this.factories[factoryId];
        if (!factoryFn) {
            throw new RangeError('There is no Identified Data Serializer factory with id ' + factoryId + '.');
        }
        const object = factoryFn(classId);
        object.readData(input);
        return object;
    }

    write(output: DataOutput, object: IdentifiedDataSerializable): void {
        output.writeBoolean(true);
        output.writeInt(object.factoryId);
        output.writeInt(object.classId);
        object.writeData(output);
    }
}

export class JsonSerializer implements Serializer {

    id = -130;

    read(input: DataInput): any {
        return JSON.parse(input.readUTF());
    }

    write(output: DataOutput, object: any): void {
        if (object instanceof HazelcastJsonValue) {
            output.writeUTF(object.toString());
        } else {
            output.writeUTF(JSON.stringify(object));
        }

    }
}

export class HazelcastJsonValueSerializer extends JsonSerializer {

    read(input: DataInput): HazelcastJsonValue {
        return new HazelcastJsonValue(input.readUTF());
    }
}
