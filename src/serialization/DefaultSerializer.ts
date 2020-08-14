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

/** @internal */
export class StringSerializer implements Serializer {

    id = -11;

    read(input: DataInput): any {
        return input.readUTF();
    }

    write(output: DataOutput, object: any): void {
        output.writeUTF(object);
    }
}

/** @internal */
export class DoubleSerializer implements Serializer {

    id = -10;

    read(input: DataInput): any {
        return input.readDouble();
    }

    write(output: DataOutput, object: any): void {
        output.writeDouble(object);
    }
}

/** @internal */
export class BooleanSerializer implements Serializer {

    id = -4;

    read(input: DataInput): any {
        return input.readBoolean();
    }

    write(output: DataOutput, object: any): void {
        output.writeBoolean(object);
    }
}

/** @internal */
export const NULL_TYPE_ID = 0;

/** @internal */
export class NullSerializer implements Serializer {

    id = NULL_TYPE_ID;

    read(input: DataInput): any {
        return null;
    }

    write(output: DataOutput, object: any): void {
        // no-op
    }
}

/** @internal */
export class ShortSerializer implements Serializer {

    id = -6;

    read(input: DataInput): any {
        return input.readShort();
    }

    write(output: DataOutput, object: any): void {
        output.writeShort(object);
    }
}

/** @internal */
export class IntegerSerializer implements Serializer {

    id = -7;

    read(input: DataInput): any {
        return input.readInt();
    }

    write(output: DataOutput, object: any): void {
        output.writeInt(object);
    }
}

/** @internal */
export class LongSerializer implements Serializer {

    id = -8;

    read(input: DataInput): any {
        return input.readLong();
    }

    write(output: DataOutput, object: any): void {
        output.writeLong(object);
    }
}

/** @internal */
export class FloatSerializer implements Serializer {

    id = -9;

    read(input: DataInput): any {
        return input.readFloat();
    }

    write(output: DataOutput, object: any): void {
        output.writeFloat(object);
    }
}

/** @internal */
export class DateSerializer implements Serializer {

    id = -25;

    read(input: DataInput): any {
        return new Date(input.readLong().toNumber());
    }

    write(output: DataOutput, object: any): void {
        output.writeLong(Long.fromNumber(object.getMilliseconds()));
    }
}

/** @internal */
export class BooleanArraySerializer implements Serializer {

    id = -13;

    read(input: DataInput): any {
        return input.readBooleanArray();
    }

    write(output: DataOutput, object: any): void {
        output.writeBooleanArray(object);
    }
}

/** @internal */
export class ShortArraySerializer implements Serializer {

    id = -15;

    read(input: DataInput): any {
        return input.readShortArray();
    }

    write(output: DataOutput, object: any): void {
        output.writeShortArray(object);
    }
}

/** @internal */
export class IntegerArraySerializer implements Serializer {

    id = -16;

    read(input: DataInput): any {
        return input.readIntArray();
    }

    write(output: DataOutput, object: any): void {
        output.writeIntArray(object);
    }
}

/** @internal */
export class LongArraySerializer implements Serializer {

    id = -17;

    read(input: DataInput): any {
        return input.readLongArray();
    }

    write(output: DataOutput, object: any): void {
        output.writeLongArray(object);
    }
}

/** @internal */
export class DoubleArraySerializer implements Serializer {

    id = -19;

    read(input: DataInput): any {
        return input.readDoubleArray();
    }

    write(output: DataOutput, object: any): void {
        output.writeDoubleArray(object);
    }
}

/** @internal */
export class StringArraySerializer implements Serializer {

    id = -20;

    read(input: DataInput): any {
        return input.readUTFArray();
    }

    write(output: DataOutput, object: any): void {
        output.writeUTFArray(object);
    }
}

/** @internal */
export class ByteSerializer implements Serializer {

    id = -3;

    read(input: DataInput): any {
        return input.readByte();
    }

    write(output: DataOutput, object: any): void {
        output.writeByte(object);
    }
}

/** @internal */
export class ByteArraySerializer implements Serializer {

    id = -12;

    read(input: DataInput): any {
        return input.readByteArray();
    }

    write(output: DataOutput, object: any): void {
        output.writeByteArray(object);
    }
}

/** @internal */
export class CharSerializer implements Serializer {

    id = -5;

    read(input: DataInput): any {
        return input.readChar();
    }

    write(output: DataOutput, object: any): void {
        output.writeChar(object);
    }
}

/** @internal */
export class CharArraySerializer implements Serializer {

    id = -14;

    read(input: DataInput): any {
        return input.readCharArray();
    }

    write(output: DataOutput, object: any): void {
        output.writeCharArray(object);
    }
}

/** @internal */
export class FloatArraySerializer implements Serializer {

    id = -18;

    read(input: DataInput): any {
        return input.readFloatArray();
    }

    write(output: DataOutput, object: any): void {
        output.writeFloatArray(object);
    }
}

/** @internal */
export class JavaClassSerializer implements Serializer {

    id = -24;

    read(input: DataInput): any {
        return input.readUTF();
    }

    write(output: DataOutput, object: any): void {
        output.writeUTF(object);
    }
}

/** @internal */
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

/** @internal */
export class ArrayListSerializer extends LinkedListSerializer {

    id = -29;
}

/** @internal */
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

/** @internal */
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

/** @internal */
export class HazelcastJsonValueSerializer extends JsonSerializer {

    read(input: DataInput): HazelcastJsonValue {
        return new HazelcastJsonValue(input.readUTF());
    }
}
