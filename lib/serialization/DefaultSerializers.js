"use strict";
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
/** @ignore */ /** */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BigIntSerializer = exports.BigDecimalSerializer = exports.OffsetDateTimeSerializer = exports.LocalDateTimeSerializer = exports.LocalTimeSerializer = exports.LocalDateSerializer = exports.UuidSerializer = exports.HazelcastJsonValueSerializer = exports.JsonSerializer = exports.IdentifiedDataSerializableSerializer = exports.LinkedListSerializer = exports.ArrayListSerializer = exports.JavaArraySerializer = exports.JavaClassSerializer = exports.FloatArraySerializer = exports.CharArraySerializer = exports.CharSerializer = exports.ByteArraySerializer = exports.ByteSerializer = exports.StringArraySerializer = exports.DoubleArraySerializer = exports.LongArraySerializer = exports.IntegerArraySerializer = exports.ShortArraySerializer = exports.BooleanArraySerializer = exports.DateSerializer = exports.FloatSerializer = exports.LongSerializer = exports.IntegerSerializer = exports.ShortSerializer = exports.NullSerializer = exports.NULL_TYPE_ID = exports.BooleanSerializer = exports.DoubleSerializer = exports.StringSerializer = void 0;
const Long = require("long");
const core_1 = require("../core");
const BigDecimalUtil = require("../util/BigDecimalUtil");
/** @internal */
class StringSerializer {
    constructor() {
        this.id = -11;
    }
    read(input) {
        return input.readString();
    }
    write(output, object) {
        output.writeString(object);
    }
}
exports.StringSerializer = StringSerializer;
/** @internal */
class DoubleSerializer {
    constructor() {
        this.id = -10;
    }
    read(input) {
        return input.readDouble();
    }
    write(output, object) {
        output.writeDouble(object);
    }
}
exports.DoubleSerializer = DoubleSerializer;
/** @internal */
class BooleanSerializer {
    constructor() {
        this.id = -4;
    }
    read(input) {
        return input.readBoolean();
    }
    write(output, object) {
        output.writeBoolean(object);
    }
}
exports.BooleanSerializer = BooleanSerializer;
/** @internal */
exports.NULL_TYPE_ID = 0;
/** @internal */
class NullSerializer {
    constructor() {
        this.id = exports.NULL_TYPE_ID;
    }
    read(_input) {
        return null;
    }
    write(_output, _object) {
        // no-op
    }
}
exports.NullSerializer = NullSerializer;
/** @internal */
class ShortSerializer {
    constructor() {
        this.id = -6;
    }
    read(input) {
        return input.readShort();
    }
    write(output, object) {
        output.writeShort(object);
    }
}
exports.ShortSerializer = ShortSerializer;
/** @internal */
class IntegerSerializer {
    constructor() {
        this.id = -7;
    }
    read(input) {
        return input.readInt();
    }
    write(output, object) {
        output.writeInt(object);
    }
}
exports.IntegerSerializer = IntegerSerializer;
/** @internal */
class LongSerializer {
    constructor() {
        this.id = -8;
    }
    read(input) {
        return input.readLong();
    }
    write(output, object) {
        output.writeLong(object);
    }
}
exports.LongSerializer = LongSerializer;
/** @internal */
class FloatSerializer {
    constructor() {
        this.id = -9;
    }
    read(input) {
        return input.readFloat();
    }
    write(output, object) {
        output.writeFloat(object);
    }
}
exports.FloatSerializer = FloatSerializer;
/** @internal */
class DateSerializer {
    constructor() {
        this.id = -25;
    }
    read(input) {
        return new Date(input.readLong().toNumber());
    }
    write(output, object) {
        output.writeLong(Long.fromNumber(object.getTime()));
    }
}
exports.DateSerializer = DateSerializer;
/** @internal */
class BooleanArraySerializer {
    constructor() {
        this.id = -13;
    }
    read(input) {
        return input.readBooleanArray();
    }
    write(output, object) {
        output.writeBooleanArray(object);
    }
}
exports.BooleanArraySerializer = BooleanArraySerializer;
/** @internal */
class ShortArraySerializer {
    constructor() {
        this.id = -15;
    }
    read(input) {
        return input.readShortArray();
    }
    write(output, object) {
        output.writeShortArray(object);
    }
}
exports.ShortArraySerializer = ShortArraySerializer;
/** @internal */
class IntegerArraySerializer {
    constructor() {
        this.id = -16;
    }
    read(input) {
        return input.readIntArray();
    }
    write(output, object) {
        output.writeIntArray(object);
    }
}
exports.IntegerArraySerializer = IntegerArraySerializer;
/** @internal */
class LongArraySerializer {
    constructor() {
        this.id = -17;
    }
    read(input) {
        return input.readLongArray();
    }
    write(output, object) {
        output.writeLongArray(object);
    }
}
exports.LongArraySerializer = LongArraySerializer;
/** @internal */
class DoubleArraySerializer {
    constructor() {
        this.id = -19;
    }
    read(input) {
        return input.readDoubleArray();
    }
    write(output, object) {
        output.writeDoubleArray(object);
    }
}
exports.DoubleArraySerializer = DoubleArraySerializer;
/** @internal */
class StringArraySerializer {
    constructor() {
        this.id = -20;
    }
    read(input) {
        return input.readStringArray();
    }
    write(output, object) {
        output.writeStringArray(object);
    }
}
exports.StringArraySerializer = StringArraySerializer;
/** @internal */
class ByteSerializer {
    constructor() {
        this.id = -3;
    }
    read(input) {
        return input.readByte();
    }
    write(output, object) {
        output.writeByte(object);
    }
}
exports.ByteSerializer = ByteSerializer;
/** @internal */
class ByteArraySerializer {
    constructor() {
        this.id = -12;
    }
    read(input) {
        return input.readByteArray();
    }
    write(output, object) {
        output.writeByteArray(object);
    }
}
exports.ByteArraySerializer = ByteArraySerializer;
/** @internal */
class CharSerializer {
    constructor() {
        this.id = -5;
    }
    read(input) {
        return input.readChar();
    }
    write(output, object) {
        // no-op
    }
}
exports.CharSerializer = CharSerializer;
/** @internal */
class CharArraySerializer {
    constructor() {
        this.id = -14;
    }
    read(input) {
        return input.readCharArray();
    }
    write(output, object) {
        // no-op
    }
}
exports.CharArraySerializer = CharArraySerializer;
/** @internal */
class FloatArraySerializer {
    constructor() {
        this.id = -18;
    }
    read(input) {
        return input.readFloatArray();
    }
    write(output, object) {
        output.writeFloatArray(object);
    }
}
exports.FloatArraySerializer = FloatArraySerializer;
/** @internal */
class JavaClassSerializer {
    constructor() {
        this.id = -24;
    }
    read(input) {
        return input.readString();
    }
    write(output, object) {
        // no-op
    }
}
exports.JavaClassSerializer = JavaClassSerializer;
/** @internal */
class JavaArraySerializer {
    constructor() {
        this.id = -28;
    }
    read(input) {
        const size = input.readInt();
        const result = new Array(size);
        for (let i = 0; i < size; i++) {
            result[i] = input.readObject();
        }
        return result;
    }
    write(_output, _object) {
        // no-op
    }
}
exports.JavaArraySerializer = JavaArraySerializer;
/** @internal */
class ArrayListSerializer extends JavaArraySerializer {
    constructor() {
        super(...arguments);
        this.id = -29;
    }
}
exports.ArrayListSerializer = ArrayListSerializer;
/** @internal */
class LinkedListSerializer extends JavaArraySerializer {
    constructor() {
        super(...arguments);
        this.id = -30;
    }
}
exports.LinkedListSerializer = LinkedListSerializer;
/** @internal */
class IdentifiedDataSerializableSerializer {
    constructor(factories) {
        this.id = -2;
        this.factories = factories;
    }
    read(input) {
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
    write(output, object) {
        output.writeBoolean(true);
        output.writeInt(object.factoryId);
        output.writeInt(object.classId);
        object.writeData(output);
    }
}
exports.IdentifiedDataSerializableSerializer = IdentifiedDataSerializableSerializer;
/** @internal */
class JsonSerializer {
    constructor() {
        this.id = -130;
    }
    read(input) {
        return JSON.parse(input.readString());
    }
    write(output, object) {
        if (object instanceof core_1.HazelcastJsonValue) {
            output.writeString(object.toString());
        }
        else {
            output.writeString(JSON.stringify(object));
        }
    }
}
exports.JsonSerializer = JsonSerializer;
/** @internal */
class HazelcastJsonValueSerializer extends JsonSerializer {
    read(input) {
        return new core_1.HazelcastJsonValue(input.readString());
    }
}
exports.HazelcastJsonValueSerializer = HazelcastJsonValueSerializer;
/** @internal */
class UuidSerializer {
    constructor() {
        this.id = -21;
    }
    read(input) {
        return new core_1.UUID(input.readLong(), input.readLong());
    }
    write(output, uuid) {
        output.writeLong(uuid.mostSignificant);
        output.writeLong(uuid.leastSignificant);
    }
}
exports.UuidSerializer = UuidSerializer;
/** @internal */
class LocalDateSerializer {
    constructor() {
        this.id = -51;
    }
    read(input) {
        const year = input.readInt();
        const month = input.readByte();
        const date = input.readByte();
        return new core_1.LocalDate(year, month, date);
    }
    write(output, localDate) {
        output.writeInt(localDate.year);
        output.writeByte(localDate.month);
        output.writeByte(localDate.date);
    }
}
exports.LocalDateSerializer = LocalDateSerializer;
/** @internal */
class LocalTimeSerializer {
    constructor() {
        this.id = -52;
    }
    read(input) {
        const hour = input.readByte();
        const minute = input.readByte();
        const second = input.readByte();
        const nano = input.readInt();
        return new core_1.LocalTime(hour, minute, second, nano);
    }
    write(output, localTime) {
        output.writeByte(localTime.hour);
        output.writeByte(localTime.minute);
        output.writeByte(localTime.second);
        output.writeInt(localTime.nano);
    }
}
exports.LocalTimeSerializer = LocalTimeSerializer;
/** @internal */
class LocalDateTimeSerializer {
    constructor() {
        this.id = -53;
    }
    read(input) {
        const year = input.readInt();
        const month = input.readByte();
        const date = input.readByte();
        const hour = input.readByte();
        const minute = input.readByte();
        const second = input.readByte();
        const nano = input.readInt();
        return core_1.LocalDateTime.from(year, month, date, hour, minute, second, nano);
    }
    write(output, localDateTime) {
        output.writeInt(localDateTime.localDate.year);
        output.writeByte(localDateTime.localDate.month);
        output.writeByte(localDateTime.localDate.date);
        output.writeByte(localDateTime.localTime.hour);
        output.writeByte(localDateTime.localTime.minute);
        output.writeByte(localDateTime.localTime.second);
        output.writeInt(localDateTime.localTime.nano);
    }
}
exports.LocalDateTimeSerializer = LocalDateTimeSerializer;
/** @internal */
class OffsetDateTimeSerializer {
    constructor() {
        this.id = -54;
    }
    read(input) {
        const year = input.readInt();
        const month = input.readByte();
        const date = input.readByte();
        const hour = input.readByte();
        const minute = input.readByte();
        const second = input.readByte();
        const nano = input.readInt();
        const offsetSeconds = input.readInt();
        return core_1.OffsetDateTime.from(year, month, date, hour, minute, second, nano, offsetSeconds);
    }
    write(output, offsetDateTime) {
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
exports.OffsetDateTimeSerializer = OffsetDateTimeSerializer;
/** @internal */
class BigDecimalSerializer {
    constructor() {
        this.id = -27;
    }
    read(input) {
        const body = input.readByteArray();
        const scale = input.readInt();
        return new core_1.BigDecimal(BigDecimalUtil.bufferToBigInt(body), scale);
    }
    write(output, bigDecimal) {
        output.writeByteArray(BigDecimalUtil.bigIntToBuffer(bigDecimal.unscaledValue));
        output.writeInt(bigDecimal.scale);
    }
}
exports.BigDecimalSerializer = BigDecimalSerializer;
/** @internal */
class BigIntSerializer {
    constructor() {
        this.id = -26;
    }
    read(input) {
        const body = input.readByteArray();
        return BigDecimalUtil.bufferToBigInt(body);
    }
    write(output, bigint) {
        output.writeByteArray(BigDecimalUtil.bigIntToBuffer(bigint));
    }
}
exports.BigIntSerializer = BigIntSerializer;
//# sourceMappingURL=DefaultSerializers.js.map