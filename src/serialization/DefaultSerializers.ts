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

import * as Long from 'long';
import {DataInput, DataOutput} from './Data';
import {
    Serializer,
    IdentifiedDataSerializable,
    IdentifiedDataSerializableFactory
} from './Serializable';
import {
    BigDecimal,
    HazelcastJsonValue,
    LocalDate,
    LocalDateTime,
    LocalTime,
    OffsetDateTime,
    UUID
} from '../core';
import * as BigDecimalUtil from '../util/BigDecimalUtil';

/** @internal */
export class StringSerializer implements Serializer<string> {

    id = -11;

    read(input: DataInput): string {
        return input.readString();
    }

    write(output: DataOutput, object: string): void {
        output.writeString(object);
    }
}

/** @internal */
export class DoubleSerializer implements Serializer<number> {

    id = -10;

    read(input: DataInput): number {
        return input.readDouble();
    }

    write(output: DataOutput, object: number): void {
        output.writeDouble(object);
    }
}

/** @internal */
export class BooleanSerializer implements Serializer<boolean> {

    id = -4;

    read(input: DataInput): boolean {
        return input.readBoolean();
    }

    write(output: DataOutput, object: boolean): void {
        output.writeBoolean(object);
    }
}

/** @internal */
export const NULL_TYPE_ID = 0;

/** @internal */
export class NullSerializer implements Serializer<null> {

    id = NULL_TYPE_ID;

    read(_input: DataInput): null {
        return null;
    }

    write(_output: DataOutput, _object: any): void {
        // no-op
    }
}

/** @internal */
export class ShortSerializer implements Serializer<number> {

    id = -6;

    read(input: DataInput): number {
        return input.readShort();
    }

    write(output: DataOutput, object: number): void {
        output.writeShort(object);
    }
}

/** @internal */
export class IntegerSerializer implements Serializer<number> {

    id = -7;

    read(input: DataInput): number {
        return input.readInt();
    }

    write(output: DataOutput, object: number): void {
        output.writeInt(object);
    }
}

/** @internal */
export class LongSerializer implements Serializer<Long> {

    id = -8;

    read(input: DataInput): Long {
        return input.readLong();
    }

    write(output: DataOutput, object: Long): void {
        output.writeLong(object);
    }
}

/** @internal */
export class FloatSerializer implements Serializer<number> {

    id = -9;

    read(input: DataInput): number {
        return input.readFloat();
    }

    write(output: DataOutput, object: number): void {
        output.writeFloat(object);
    }
}

/** @internal */
export class DateSerializer implements Serializer<Date> {

    id = -25;

    read(input: DataInput): Date {
        return new Date(input.readLong().toNumber());
    }

    write(output: DataOutput, object: Date): void {
        output.writeLong(Long.fromNumber(object.getTime()));
    }
}

/** @internal */
export class BooleanArraySerializer implements Serializer<boolean[]> {

    id = -13;

    read(input: DataInput): boolean[] {
        return input.readBooleanArray();
    }

    write(output: DataOutput, object: boolean[]): void {
        output.writeBooleanArray(object);
    }
}

/** @internal */
export class ShortArraySerializer implements Serializer<number[]> {

    id = -15;

    read(input: DataInput): any {
        return input.readShortArray();
    }

    write(output: DataOutput, object: number[]): void {
        output.writeShortArray(object);
    }
}

/** @internal */
export class IntegerArraySerializer implements Serializer<number[]> {

    id = -16;

    read(input: DataInput): number[] {
        return input.readIntArray();
    }

    write(output: DataOutput, object: number[]): void {
        output.writeIntArray(object);
    }
}

/** @internal */
export class LongArraySerializer implements Serializer<Long[]> {

    id = -17;

    read(input: DataInput): Long[] {
        return input.readLongArray();
    }

    write(output: DataOutput, object: Long[]): void {
        output.writeLongArray(object);
    }
}

/** @internal */
export class DoubleArraySerializer implements Serializer<number[]> {

    id = -19;

    read(input: DataInput): number[] {
        return input.readDoubleArray();
    }

    write(output: DataOutput, object: number[]): void {
        output.writeDoubleArray(object);
    }
}

/** @internal */
export class StringArraySerializer implements Serializer<string[]> {

    id = -20;

    read(input: DataInput): string[] {
        return input.readStringArray();
    }

    write(output: DataOutput, object: string[]): void {
        output.writeStringArray(object);
    }
}

/** @internal */
export class ByteSerializer implements Serializer<number> {

    id = -3;

    read(input: DataInput): number {
        return input.readByte();
    }

    write(output: DataOutput, object: number): void {
        output.writeByte(object);
    }
}

/** @internal */
export class ByteArraySerializer implements Serializer<Buffer> {

    id = -12;

    read(input: DataInput): Buffer {
        return input.readByteArray();
    }

    write(output: DataOutput, object: Buffer): void {
        output.writeByteArray(object);
    }
}

/** @internal */
export class CharSerializer implements Serializer<string> {

    id = -5;

    read(input: DataInput): string {
        return input.readChar();
    }

    write(output: DataOutput, object: string): void {
        // no-op
    }
}

/** @internal */
export class CharArraySerializer implements Serializer<string[]> {

    id = -14;

    read(input: DataInput): string[] {
        return input.readCharArray();
    }

    write(output: DataOutput, object: string[]): void {
        // no-op
    }
}

/** @internal */
export class FloatArraySerializer implements Serializer<number[]> {

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
        return input.readString();
    }

    write(output: DataOutput, object: any): void {
        // no-op
    }
}

/** @internal */
export class JavaArraySerializer implements Serializer<any[]> {

    id = -28;

    read(input: DataInput): any[] {
        const size = input.readInt();
        const result = new Array<any>(size);
        for (let i = 0; i < size; i++) {
            result[i] = input.readObject();
        }
        return result;
    }

    write(_output: DataOutput, _object: any[]): void {
        // no-op
    }
}


/** @internal */
export class ArrayListSerializer extends JavaArraySerializer {

    id = -29;
}

/** @internal */
export class LinkedListSerializer extends JavaArraySerializer {

    id = -30;
}

/** @internal */
export class IdentifiedDataSerializableSerializer implements Serializer {

    id = -2;
    private readonly factories: { [id: number]: IdentifiedDataSerializableFactory };

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
        return JSON.parse(input.readString());
    }

    write(output: DataOutput, object: any): void {
        if (object instanceof HazelcastJsonValue) {
            output.writeString(object.toString());
        } else {
            output.writeString(JSON.stringify(object));
        }

    }
}

/** @internal */
export class HazelcastJsonValueSerializer extends JsonSerializer {

    read(input: DataInput): HazelcastJsonValue {
        return new HazelcastJsonValue(input.readString());
    }
}

/** @internal */
export class UuidSerializer implements Serializer<UUID> {

    id = -21;

    read(input: DataInput): UUID {
        return new UUID(input.readLong(), input.readLong());
    }

    write(output: DataOutput, uuid: UUID): void {
        output.writeLong(uuid.mostSignificant);
        output.writeLong(uuid.leastSignificant);
    }
}

/** @internal */
export class LocalDateSerializer implements Serializer<LocalDate> {

    id = -51;

    read(input: DataInput): LocalDate {
        const year = input.readInt();
        const month = input.readByte();
        const date = input.readByte();

        return new LocalDate(year, month, date);
    }

    write(output: DataOutput, localDate: LocalDate): void {
        output.writeInt(localDate.year);
        output.writeByte(localDate.month);
        output.writeByte(localDate.date);
    }
}

/** @internal */
export class LocalTimeSerializer implements Serializer<LocalTime> {

    id = -52;

    read(input: DataInput): LocalTime {
        const hour = input.readByte();
        const minute = input.readByte();
        const second = input.readByte();
        const nano = input.readInt();

        return new LocalTime(hour, minute, second, nano);
    }

    write(output: DataOutput, localTime: LocalTime): void {
        output.writeByte(localTime.hour);
        output.writeByte(localTime.minute);
        output.writeByte(localTime.second);
        output.writeInt(localTime.nano);
    }
}

/** @internal */
export class LocalDateTimeSerializer implements Serializer<LocalDateTime> {

    id = -53;

    read(input: DataInput): LocalDateTime {
        const year = input.readInt();
        const month = input.readByte();
        const date = input.readByte();

        const hour = input.readByte();
        const minute = input.readByte();
        const second = input.readByte();
        const nano = input.readInt();

        return LocalDateTime.from(year, month, date, hour, minute, second, nano);
    }

    write(output: DataOutput, localDateTime: LocalDateTime): void {
        output.writeInt(localDateTime.localDate.year);
        output.writeByte(localDateTime.localDate.month);
        output.writeByte(localDateTime.localDate.date);

        output.writeByte(localDateTime.localTime.hour);
        output.writeByte(localDateTime.localTime.minute);
        output.writeByte(localDateTime.localTime.second);
        output.writeInt(localDateTime.localTime.nano);
    }
}

/** @internal */
export class OffsetDateTimeSerializer implements Serializer<OffsetDateTime> {

    id = -54;

    read(input: DataInput): OffsetDateTime {
        const year = input.readInt();
        const month = input.readByte();
        const date = input.readByte();

        const hour = input.readByte();
        const minute = input.readByte();
        const second = input.readByte();
        const nano = input.readInt();

        const offsetSeconds = input.readInt();

        return OffsetDateTime.from(year, month, date, hour, minute, second, nano, offsetSeconds);
    }

    write(output: DataOutput, offsetDateTime: OffsetDateTime): void {
        output.writeInt(offsetDateTime.localDateTime.localDate.year);
        output.writeByte(offsetDateTime.localDateTime.localDate.month);
        output.writeByte(offsetDateTime.localDateTime.localDate.date);

        output.writeByte(offsetDateTime.localDateTime.localTime.hour);
        output.writeByte(offsetDateTime.localDateTime.localTime.minute);
        output.writeByte(offsetDateTime.localDateTime.localTime.second);
        output.writeInt(offsetDateTime.localDateTime.localTime.nano);

        output.writeInt(offsetDateTime.offsetSeconds);
    }
}

/** @internal */
export class BigDecimalSerializer implements Serializer<BigDecimal> {

    id = -27;

    read(input: DataInput): BigDecimal {
        const body = input.readByteArray();
        const scale = input.readInt();

        return new BigDecimal(BigDecimalUtil.bufferToBigInt(body), scale);
    }

    write(output: DataOutput, bigDecimal: BigDecimal): void {
        output.writeByteArray(BigDecimalUtil.bigIntToBuffer(bigDecimal.unscaledValue));
        output.writeInt(bigDecimal.scale);
    }
}

/** @internal */
export class BigIntSerializer implements Serializer<BigInt> {

    id = -26;

    read(input: DataInput): BigInt {
        const body = input.readByteArray();
        return BigDecimalUtil.bufferToBigInt(body);
    }

    write(output: DataOutput, bigint: BigInt): void {
        output.writeByteArray(BigDecimalUtil.bigIntToBuffer(bigint));
    }
}
