/*
 * Copyright (c) 2008-2026, Hazelcast, Inc. All Rights Reserved.
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
'use strict';

const { expect } = require('chai');
const { Long } = require('../../../lib/long');
const { SerializationServiceV1 } = require('../../../lib/serialization/SerializationService');
const { SerializationConfigImpl } = require('../../../lib/config/SerializationConfig');
const {
    ByteSerializer,
    ShortSerializer,
    IntegerSerializer,
    LongSerializer,
    FloatSerializer,
    DoubleSerializer,
    ByteArraySerializer,
    ShortArraySerializer,
    IntegerArraySerializer,
    LongArraySerializer,
    FloatArraySerializer,
    DoubleArraySerializer
} = require('../../../lib/serialization/DefaultSerializers');
const {
    int8, int16, int32, int64, float32, float64,
    Int8, Int16, Int32, Int64, Float32, Float64
} = require('../../../lib/core/TypedNumbers');

function newService() {
    const config = new SerializationConfigImpl();
    return new SerializationServiceV1(config);
}

describe('TypedNumbersTest', function () {
    describe('factory functions produce the right wrapper and value', function () {
        it('int8', function () {
            const v = int8(5);
            expect(v).to.be.instanceOf(Int8);
            expect(v.value).to.equal(5);
            expect(v.typeName).to.equal('int8');
        });

        it('int16', function () {
            const v = int16(300);
            expect(v).to.be.instanceOf(Int16);
            expect(v.value).to.equal(300);
            expect(v.typeName).to.equal('int16');
        });

        it('int32', function () {
            const v = int32(100000);
            expect(v).to.be.instanceOf(Int32);
            expect(v.value).to.equal(100000);
            expect(v.typeName).to.equal('int32');
        });

        it('int64 from number', function () {
            const v = int64(5);
            expect(v).to.be.instanceOf(Int64);
            expect(Long.isLong(v.value)).to.be.true;
            expect(v.value.equals(Long.fromInt(5))).to.be.true;
            expect(v.typeName).to.equal('int64');
        });

        it('int64 from bigint', function () {
            const v = int64(BigInt('1234567890123456789'));
            expect(v).to.be.instanceOf(Int64);
            expect(v.value.equals(Long.fromString('1234567890123456789'))).to.be.true;
        });

        it('int64 from Long (used as-is)', function () {
            const l = Long.fromInt(42);
            const v = int64(l);
            expect(v).to.be.instanceOf(Int64);
            expect(v.value).to.equal(l);
        });

        it('float32', function () {
            const v = float32(1.5);
            expect(v).to.be.instanceOf(Float32);
            expect(v.value).to.equal(1.5);
            expect(v.typeName).to.equal('float32');
        });

        it('float64', function () {
            const v = float64(1.5);
            expect(v).to.be.instanceOf(Float64);
            expect(v.value).to.equal(1.5);
            expect(v.typeName).to.equal('float64');
        });
    });

    describe('serialization uses wrapper\'s own wire type', function () {
        it('int8 -> byte (-3)', function () {
            const service = newService();
            expect(service.toData(int8(5)).getType()).to.equal(new ByteSerializer().id);
        });

        it('int16 -> short (-6)', function () {
            const service = newService();
            expect(service.toData(int16(300)).getType()).to.equal(new ShortSerializer().id);
        });

        it('int32 -> int (-7)', function () {
            const service = newService();
            expect(service.toData(int32(100000)).getType()).to.equal(new IntegerSerializer().id);
        });

        it('int64 -> long (-8)', function () {
            const service = newService();
            expect(service.toData(int64(5n)).getType()).to.equal(new LongSerializer().id);
        });

        it('float32 -> float (-9)', function () {
            const service = newService();
            expect(service.toData(float32(1.5)).getType()).to.equal(new FloatSerializer().id);
        });

        it('float64 -> double (-10)', function () {
            const service = newService();
            expect(service.toData(float64(1.5)).getType()).to.equal(new DoubleSerializer().id);
        });
    });

    describe('plain numbers always use double while wrappers keep their own type', function () {
        it('a plain number is serialized as double', function () {
            const service = newService();
            expect(service.toData(5).getType()).to.equal(new DoubleSerializer().id);
        });

        it('an int32 wrapper is serialized as int', function () {
            const service = newService();
            expect(service.toData(int32(5)).getType()).to.equal(new IntegerSerializer().id);
        });

        it('an int64 wrapper is serialized as long', function () {
            const service = newService();
            expect(service.toData(int64(5n)).getType()).to.equal(new LongSerializer().id);
        });

        it('a float32 wrapper is serialized as float', function () {
            const service = newService();
            expect(service.toData(float32(1.5)).getType()).to.equal(new FloatSerializer().id);
        });
    });

    describe('round trip', function () {
        it('int8 round trips to a plain number', function () {
            const service = newService();
            expect(service.toObject(service.toData(int8(5)))).to.equal(5);
        });

        it('int16 round trips to a plain number', function () {
            const service = newService();
            expect(service.toObject(service.toData(int16(-300)))).to.equal(-300);
        });

        it('int32 round trips to a plain number', function () {
            const service = newService();
            expect(service.toObject(service.toData(int32(-100000)))).to.equal(-100000);
        });

        it('int64 round trips to a Long', function () {
            const service = newService();
            const result = service.toObject(service.toData(int64(BigInt('1234567890123456789'))));
            expect(Long.isLong(result)).to.be.true;
            expect(result.equals(Long.fromString('1234567890123456789'))).to.be.true;
        });

        it('float32 round trips to a plain number', function () {
            const service = newService();
            expect(service.toObject(service.toData(float32(1.5)))).to.equal(1.5);
        });

        it('float64 round trips to a plain number', function () {
            const service = newService();
            expect(service.toObject(service.toData(float64(1.5)))).to.equal(1.5);
        });
    });

    describe('validation throws RangeError', function () {
        it('int8 rejects out-of-range values', function () {
            expect(() => int8(128)).to.throw(RangeError);
            expect(() => int8(-129)).to.throw(RangeError);
        });

        it('int8 rejects non-integers', function () {
            expect(() => int8(1.5)).to.throw(RangeError);
        });

        it('int16 rejects out-of-range values', function () {
            expect(() => int16(32768)).to.throw(RangeError);
            expect(() => int16(-32769)).to.throw(RangeError);
        });

        it('int32 rejects out-of-range values', function () {
            expect(() => int32(2147483648)).to.throw(RangeError);
            expect(() => int32(-2147483649)).to.throw(RangeError);
        });

        it('int32 accepts its exact bounds', function () {
            expect(int32(2147483647).value).to.equal(2147483647);
            expect(int32(-2147483648).value).to.equal(-2147483648);
        });

        it('int64 rejects non-integer numbers', function () {
            expect(() => int64(1.5)).to.throw(RangeError);
        });

        it('int64 rejects numbers beyond the exact representation range', function () {
            expect(() => int64(2 ** 53)).to.throw(RangeError);
        });

        it('int64 accepts a number at MAX_SAFE_INTEGER', function () {
            const v = int64(Number.MAX_SAFE_INTEGER);
            expect(v.value.equals(Long.fromBigInt(BigInt(Number.MAX_SAFE_INTEGER)))).to.be.true;
        });

        it('int64 rejects bigints outside the signed 64-bit range', function () {
            expect(() => int64(BigInt('9223372036854775808'))).to.throw(RangeError);
            expect(() => int64(BigInt('-9223372036854775809'))).to.throw(RangeError);
        });

        it('int64 accepts the signed 64-bit bounds', function () {
            expect(int64(BigInt('9223372036854775807')).value.equals(Long.MAX_VALUE)).to.be.true;
            expect(int64(BigInt('-9223372036854775808')).value.equals(Long.MIN_VALUE)).to.be.true;
        });

        it('float32 rejects non-finite values', function () {
            expect(() => float32(NaN)).to.throw(RangeError);
            expect(() => float32(Infinity)).to.throw(RangeError);
            expect(() => float32(-Infinity)).to.throw(RangeError);
        });

        it('float64 rejects non-finite values', function () {
            expect(() => float64(NaN)).to.throw(RangeError);
            expect(() => float64(Infinity)).to.throw(RangeError);
        });
    });

    describe('equality and toString', function () {
        it('same type and value are equal', function () {
            expect(int8(1).equals(int8(1))).to.be.true;
            expect(int32(5).equals(int32(5))).to.be.true;
        });

        it('different types are not equal', function () {
            expect(int8(1).equals(int16(1))).to.be.false;
            expect(int32(5).equals(float64(5))).to.be.false;
        });

        it('int64 equality compares the Long value', function () {
            expect(int64(5n).equals(int64(Long.fromInt(5)))).to.be.true;
            expect(int64(5n).equals(int64(6n))).to.be.false;
        });

        it('a wrapper is not equal to a raw value', function () {
            expect(int32(5).equals(5)).to.be.false;
        });

        it('toString includes the type name and value', function () {
            expect(int32(5).toString()).to.equal('int32(5)');
            expect(int64(5n).toString()).to.equal('int64(5)');
            expect(float32(1.5).toString()).to.equal('float32(1.5)');
        });

        it('wrappers are frozen', function () {
            expect(Object.isFrozen(int8(1))).to.be.true;
            expect(Object.isFrozen(int64(5n))).to.be.true;
        });
    });

    describe('arrays of wrapped values use the primitive array serializer', function () {
        it('array of int8 -> byte[]', function () {
            const service = newService();
            expect(service.toData([int8(1), int8(2)]).getType()).to.equal(new ByteArraySerializer().id);
        });

        it('array of int16 -> short[]', function () {
            const service = newService();
            expect(service.toData([int16(1), int16(2)]).getType()).to.equal(new ShortArraySerializer().id);
        });

        it('array of int32 -> int[]', function () {
            const service = newService();
            expect(service.toData([int32(1), int32(2)]).getType()).to.equal(new IntegerArraySerializer().id);
        });

        it('array of int64 -> long[]', function () {
            const service = newService();
            expect(service.toData([int64(1n), int64(2n)]).getType()).to.equal(new LongArraySerializer().id);
        });

        it('array of float32 -> float[]', function () {
            const service = newService();
            expect(service.toData([float32(1.5), float32(2.5)]).getType()).to.equal(new FloatArraySerializer().id);
        });

        it('array of float64 -> double[]', function () {
            const service = newService();
            expect(service.toData([float64(1.5), float64(2.5)]).getType()).to.equal(new DoubleArraySerializer().id);
        });

        it('array of int16 round trips to plain numbers', function () {
            const service = newService();
            const result = service.toObject(service.toData([int16(-300), int16(300)]));
            expect(result).to.deep.equal([-300, 300]);
        });

        it('array of int32 round trips to plain numbers', function () {
            const service = newService();
            const result = service.toObject(service.toData([int32(-100000), int32(100000)]));
            expect(result).to.deep.equal([-100000, 100000]);
        });

        it('array of int64 round trips to Longs', function () {
            const service = newService();
            const result = service.toObject(service.toData([int64(BigInt('1234567890123456789')), int64(-5n)]));
            expect(result).to.have.lengthOf(2);
            expect(Long.isLong(result[0])).to.be.true;
            expect(result[0].equals(Long.fromString('1234567890123456789'))).to.be.true;
            expect(result[1].equals(Long.fromInt(-5))).to.be.true;
        });

        it('array of float32 round trips to plain numbers', function () {
            const service = newService();
            const result = service.toObject(service.toData([float32(1.5), float32(-2.25)]));
            expect(result).to.deep.equal([1.5, -2.25]);
        });

        it('array of float64 round trips to plain numbers', function () {
            const service = newService();
            const result = service.toObject(service.toData([float64(1.5), float64(-2.25)]));
            expect(result).to.deep.equal([1.5, -2.25]);
        });

        it('array of int8 round trips to a Buffer', function () {
            const service = newService();
            // byte[] maps to Buffer in this client; values are stored as unsigned bytes, so -1 -> 255.
            const result = service.toObject(service.toData([int8(-1), int8(0), int8(1)]));
            expect(Buffer.isBuffer(result)).to.be.true;
            expect(Array.from(result)).to.deep.equal([255, 0, 1]);
        });

        it('a plain number array still uses the double array serializer', function () {
            const service = newService();
            expect(service.toData([1.5, 2.5]).getType()).to.equal(new DoubleArraySerializer().id);
        });
    });
});
