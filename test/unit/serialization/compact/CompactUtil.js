/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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

const { SerializationConfigImpl } = require('../../../../src');
const { SerializationServiceV1 } = require('../../../../lib/serialization/SerializationService');
const Long = require('long');
const { BigDecimal, LocalTime, LocalDate, LocalDateTime, OffsetDateTime, GenericRecords } = require('../../../../lib');
const Fields = require('../../../../lib/serialization/generic_record/Field');
const { SchemaNotReplicatedError } = require('../../../../lib/core/HazelcastError');

class InMemorySchemaService {
    constructor() {
        this.schemas = {};
    }

    get(schemaId) {
        const schema = this.schemas[schemaId.toString()];
        if (schema === undefined) {
            return null;
        }
        return schema;
    }

    put(schema) {
        const schemaId = schema.schemaId.toString();
        const existingSchema = this.schemas[schemaId];
        if (existingSchema === undefined) {
            this.schemas[schemaId] = schema;
        }
        return Promise.resolve();
    }

    putLocal(schema) {
        const schemaId = schema.schemaId;
        const existingSchema = this.schemas[schemaId];
        if (existingSchema === undefined) {
            this.schemas[schemaId] = schema;
        }
    }
}

class Bits {
    constructor() {
        this.a = false;
        this.b = false;
        this.c = false;
        this.d = false;
        this.e = false;
        this.f = false;
        this.g = false;
        this.h = false;
        this.id = 0;
        this.booleans = [];
    }
}

class BitsSerializer {
    constructor() {
        this.hzClassName = 'Bits';
    }

    read(reader) {
        const bits = new Bits();
        bits.a = reader.readBoolean('a');
        bits.b = reader.readBoolean('b');
        bits.c = reader.readBoolean('c');
        bits.d = reader.readBoolean('d');
        bits.e = reader.readBoolean('e');
        bits.f = reader.readBoolean('f');
        bits.g = reader.readBoolean('g');
        bits.h = reader.readBoolean('h');
        bits.id = reader.readInt32('id');
        bits.booleans = reader.readArrayOfBoolean('booleans');
        return bits;
    }

    write(writer, value) {
        writer.writeBoolean('a', value.a);
        writer.writeBoolean('b', value.b);
        writer.writeBoolean('c', value.c);
        writer.writeBoolean('d', value.d);
        writer.writeBoolean('e', value.e);
        writer.writeBoolean('f', value.f);
        writer.writeBoolean('g', value.g);
        writer.writeBoolean('h', value.h);
        writer.writeInt32('id', value.id);
        writer.writeArrayOfBoolean('booleans', value.booleans);
    }
}

class Employee {
    constructor(age, id) {
        this.age = age;
        this.rank = age;
        this.id = id;
        this.isHired = true;
        this.isFired = false;
    }
}

class EmployeeSerializer {
    constructor() {
        this.hzClassName = 'Employee';
    }

    read(reader) {
        const age = reader.readInt32('age');
        const rank = reader.readInt32('rank');
        const id = reader.readInt64('id');
        const isHired = reader.readBoolean('isHired');
        const isFired = reader.readBoolean('isFired');
        const employee = new Employee(age, id);
        employee.rank = rank;
        employee.isHired = isHired;
        employee.isFired = isFired;
        return employee;
    }

    write(writer, value) {
        writer.writeInt32('age', value.age);
        writer.writeInt32('rank', value.rank);
        writer.writeInt64('id', value.id);
        writer.writeBoolean('isHired', value.isHired);
        writer.writeBoolean('isFired', value.isFired);
    }
}

const HIRING_STATUS = {
    HIRING: 'HIRING',
    NOT_HIRING: 'NOT_HIRING'
};

class Employer {
    constructor(name, zcode, hiringStatus, ids, singleEmployee, otherEmployees) {
        this.name = name;
        this.zcode = zcode;
        this.hiringStatus = hiringStatus;
        this.ids = ids;
        this.singleEmployee = singleEmployee;
        this.otherEmployees = otherEmployees;
    }
}

class EmployerSerializer {
    constructor() {
        this.hzClassName = 'Employer';
    }

    read(reader) {
        const name = reader.readString('name');
        const zcode = reader.readInt32('zcode');
        const hiringStatus = reader.readString('hiringStatus');
        const ids = reader.readArrayOfInt64('ids');
        const singleEmployee = reader.readCompact('singleEmployee');
        const otherEmployees = reader.readArrayOfCompact('otherEmployees');
        return new Employer(name, zcode, hiringStatus, ids, singleEmployee, otherEmployees);
    }

    write(writer, value) {
        writer.writeString('name', value.name);
        writer.writeInt32('zcode', value.zcode);
        writer.writeString('hiringStatus', value.hiringStatus);
        writer.writeArrayOfInt64('ids', value.ids);
        writer.writeCompact('singleEmployee', value.singleEmployee);
        writer.writeArrayOfCompact('otherEmployees', value.otherEmployees);
    }
}

const createSerializationService = (compactSerializers = []) => {
    const serializationConfig = new SerializationConfigImpl();
    serializationConfig.compactSerializers = compactSerializers;
    return new SerializationServiceV1(serializationConfig, new InMemorySchemaService());
};

class NamedDTO {
    constructor(name, myint) {
        this.name = name;
        this.myint = myint;
    }
}

class InnerDTO {
    constructor(
        bools,
        bb,
        ss,
        ii,
        ll,
        ff,
        dd,
        nn,
        bigDecimals,
        localTimes,
        localDates,
        localDateTimes,
        offsetDateTimes,
        nullableBools,
        nullableBytes,
        nullableShorts,
        nullableIntegers,
        nullableLongs,
        nullableFloats,
        nullableDoubles,
        nullableLocalTimes,
        nullableLocalDates,
        nullableLocalDateTimes,
        nullableOffsetDateTimes,
    ) {
        this.bools = bools;
        this.bb = bb;
        this.ss = ss;
        this.ii = ii;
        this.ll = ll;
        this.ff = ff;
        this.dd = dd;
        this.nn = nn;
        this.bigDecimals = bigDecimals;
        this.localTimes = localTimes;
        this.localDates = localDates;
        this.localDateTimes = localDateTimes;
        this.offsetDateTimes = offsetDateTimes;
        this.nullableBools = nullableBools;
        this.nullableBytes = nullableBytes;
        this.nullableShorts = nullableShorts;
        this.nullableIntegers = nullableIntegers;
        this.nullableLongs = nullableLongs;
        this.nullableFloats = nullableFloats;
        this.nullableDoubles = nullableDoubles;
        this.nullableLocalTimes = nullableLocalTimes;
        this.nullableLocalDates = nullableLocalDates;
        this.nullableLocalDateTimes = nullableLocalDateTimes;
        this.nullableOffsetDateTimes = nullableOffsetDateTimes;
    }
}

class MainDTO {
    constructor(
        b,
        bool,
        s,
        i,
        l,
        f,
        d,
        str,
        p,
        bigDecimal,
        localTime,
        localDate,
        localDateTime,
        offsetDateTime,
        nullableB,
        nullableBool,
        nullableS,
        nullableI,
        nullableL,
        nullableF,
        nullableD
    ) {
        this.b = b;
        this.bool = bool;
        this.s = s;
        this.i = i;
        this.l = l;
        this.f = f;
        this.d = d;
        this.str = str;
        this.p = p;
        this.bigDecimal = bigDecimal;
        this.localTime = localTime;
        this.localDate = localDate;
        this.localDateTime = localDateTime;
        this.offsetDateTime = offsetDateTime;
        this.nullableB = nullableB;
        this.nullableBool = nullableBool;
        this.nullableS = nullableS;
        this.nullableI = nullableI;
        this.nullableL = nullableL;
        this.nullableF = nullableF;
        this.nullableD = nullableD;
    }
}

const createMainDTO = () => {
    const now = new Date();
    const getNowLocalTime = () => new LocalTime(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds() * 1000);
    const getNowLocalDate = () => new LocalDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const nn = new Array(2);
    nn[0] = new NamedDTO('name', 123);
    nn[1] = new NamedDTO('name', 123);
    const inner = new InnerDTO(
        [true, false], Buffer.from([1, 2, 3]), [3, 4, 5], [9, 8, 7, 6],
        [Long.fromNumber(0), Long.fromNumber(1), Long.fromNumber(5), Long.fromNumber(7), Long.fromNumber(9), Long.fromNumber(11)],
        [0.6543, -3.56, 45.67], [456.456, 789.789, 321.321], nn,
        [BigDecimal.fromString('12345'), BigDecimal.fromString('123456')],
        [getNowLocalTime(), getNowLocalTime()], [getNowLocalDate(), getNowLocalDate()],
        [LocalDateTime.fromDate(new Date(Date.UTC(2021, 8)))],
        [OffsetDateTime.fromDate(new Date(Date.UTC(2021, 8)), 0)], [true, false, null], [1, 2, 3, null], [3, 4, 5, null],
        [9, 8, 7, 6, null],
        [Long.fromNumber(0), Long.fromNumber(1), Long.fromNumber(5), Long.fromNumber(7), Long.fromNumber(9), Long.fromNumber(11)],
        [0.6543, -3.56, 45.67], [456.456, 789.789, 321.321], [getNowLocalTime(), getNowLocalTime()],
        [getNowLocalDate(), getNowLocalDate(), null], [LocalDateTime.fromDate(new Date(Date.UTC(2021, 8))), null],
        [OffsetDateTime.fromDate(new Date(Date.UTC(2021, 8)), 0)],
    );
    return new MainDTO(
        113, true, -500, 56789, Long.fromNumber(-50992225), 900.5678,
        -897543.3678909, 'this is main object created for testing!', inner,
        BigDecimal.fromString('12312313'), getNowLocalTime(), getNowLocalDate(),
        LocalDateTime.fromDate(new Date(Date.UTC(2021, 8))), OffsetDateTime.fromDate(new Date(Date.UTC(2021, 8)), 0),
        113, true, -500, 56789, Long.fromNumber(-50992225), 900.5678, -897543.3678909
    );
};

class InnerDTOSerializer {
    constructor() {
        this.hzClassName = 'InnerDTO';
    }

    read(reader) {
        const bools = reader.readArrayOfBoolean('bools');
        const bb = reader.readArrayOfInt8('bb');
        const ss = reader.readArrayOfInt16('ss');
        const ii = reader.readArrayOfInt32('ii');
        const ll = reader.readArrayOfInt64('ll');
        const ff = reader.readArrayOfFloat32('ff');
        const dd = reader.readArrayOfFloat64('dd');
        const nn = reader.readArrayOfCompact('nn');
        const bigDecimals = reader.readArrayOfDecimal('bigDecimals');
        const localTimes = reader.readArrayOfTime('localTimes');
        const localDates = reader.readArrayOfDate('localDates');
        const localDateTimes = reader.readArrayOfTimestamp('localDateTimes');
        const offsetDateTimes = reader.readArrayOfTimestampWithTimezone('offsetDateTimes');
        const nullableBools = reader.readArrayOfNullableBoolean('nullableBools');
        const nullableBytes = reader.readArrayOfNullableInt8('nullableBytes');
        const nullableShorts = reader.readArrayOfNullableInt16('nullableShorts');
        const nullableIntegers = reader.readArrayOfNullableInt32('nullableIntegers');
        const nullableLongs = reader.readArrayOfNullableInt64('nullableLongs');
        const nullableFloats = reader.readArrayOfNullableFloat32('nullableFloats');
        const nullableDoubles = reader.readArrayOfNullableFloat64('nullableDoubles');
        const nullableLocalTimes = reader.readArrayOfTime('nullableLocalTimes');
        const nullableLocalDates = reader.readArrayOfDate('nullableLocalDates');
        const nullableLocalDateTimes = reader.readArrayOfTimestamp('nullableLocalDateTimes');
        const nullableOffsetDateTimes = reader.readArrayOfTimestampWithTimezone('nullableOffsetDateTimes');

        return new InnerDTO(
            bools,
            bb,
            ss,
            ii,
            ll,
            ff,
            dd,
            nn,
            bigDecimals,
            localTimes,
            localDates,
            localDateTimes,
            offsetDateTimes,
            nullableBools,
            nullableBytes,
            nullableShorts,
            nullableIntegers,
            nullableLongs,
            nullableFloats,
            nullableDoubles,
            nullableLocalTimes,
            nullableLocalDates,
            nullableLocalDateTimes,
            nullableOffsetDateTimes,
        );
    }

    write(writer, obj) {
        writer.writeArrayOfBoolean('bools', obj.bools);
        writer.writeArrayOfInt8('bb', obj.bb);
        writer.writeArrayOfInt16('ss', obj.ss);
        writer.writeArrayOfInt32('ii', obj.ii);
        writer.writeArrayOfInt64('ll', obj.ll);
        writer.writeArrayOfFloat32('ff', obj.ff);
        writer.writeArrayOfFloat64('dd', obj.dd);
        writer.writeArrayOfCompact('nn', obj.nn);
        writer.writeArrayOfDecimal('bigDecimals', obj.bigDecimals);
        writer.writeArrayOfTime('localTimes', obj.localTimes);
        writer.writeArrayOfDate('localDates', obj.localDates);
        writer.writeArrayOfTimestamp('localDateTimes', obj.localDateTimes);
        writer.writeArrayOfTimestampWithTimezone('offsetDateTimes', obj.offsetDateTimes);
        writer.writeArrayOfNullableBoolean('nullableBools', obj.nullableBools);
        writer.writeArrayOfNullableInt8('nullableBytes', obj.nullableBytes);
        writer.writeArrayOfNullableInt16('nullableShorts', obj.nullableShorts);
        writer.writeArrayOfNullableInt32('nullableIntegers', obj.nullableIntegers);
        writer.writeArrayOfNullableInt64('nullableLongs', obj.nullableLongs);
        writer.writeArrayOfNullableFloat32('nullableFloats', obj.nullableFloats);
        writer.writeArrayOfNullableFloat64('nullableDoubles', obj.nullableDoubles);
        writer.writeArrayOfTime('nullableLocalTimes', obj.nullableLocalTimes);
        writer.writeArrayOfDate('nullableLocalDates', obj.nullableLocalDates);
        writer.writeArrayOfTimestamp('nullableLocalDateTimes', obj.nullableLocalDateTimes);
        writer.writeArrayOfTimestampWithTimezone('nullableOffsetDateTimes', obj.nullableOffsetDateTimes);
    }
}

class NamedDTOSerializer {
    constructor() {
        this.hzClassName = 'NamedDTO';
    }

    read(reader) {
        const name = reader.readString('name');
        const myint = reader.readInt32('myint');

        return new NamedDTO(name, myint);
    }

    write(writer, obj) {
        writer.writeString('name', obj.name);
        writer.writeInt32('myint', obj.myint);
    }
}

class MainDTOSerializer {
    constructor() {
        this.hzClassName = 'MainDTO';
    }

    read(reader) {
        const b = reader.readInt8('b');
        const bool = reader.readBoolean('bool');
        const s = reader.readInt16('s');
        const i = reader.readInt32('i');
        const l = reader.readInt64('l');
        const f = reader.readFloat32('f');
        const d = reader.readFloat64('d');
        const str = reader.readString('str');
        const p = reader.readCompact('p');
        const bigDecimal = reader.readDecimal('bigDecimal');
        const localTime = reader.readTime('localTime');
        const localDate = reader.readDate('localDate');
        const localDateTime = reader.readTimestamp('localDateTime');
        const offsetDateTime = reader.readTimestampWithTimezone('offsetDateTime');
        const nullableB = reader.readNullableInt8('nullableB');
        const nullableBool = reader.readNullableBoolean('nullableBool');
        const nullableS = reader.readNullableInt16('nullableS');
        const nullableI = reader.readNullableInt32('nullableI');
        const nullableL = reader.readNullableInt64('nullableL');
        const nullableF = reader.readNullableFloat32('nullableF');
        const nullableD = reader.readNullableFloat64('nullableD');

        return new MainDTO(
            b, bool, s, i, l, f, d, str, p, bigDecimal, localTime, localDate, localDateTime,
            offsetDateTime, nullableB, nullableBool, nullableS, nullableI, nullableL, nullableF, nullableD
        );
    }
    write(writer, obj) {
        writer.writeInt8('b', obj.b);
        writer.writeBoolean('bool', obj.bool);
        writer.writeInt16('s', obj.s);
        writer.writeInt32('i', obj.i);
        writer.writeInt64('l', obj.l);
        writer.writeFloat32('f', obj.f);
        writer.writeFloat64('d', obj.d);
        writer.writeString('str', obj.str);
        writer.writeCompact('p', obj.p);
        writer.writeDecimal('bigDecimal', obj.bigDecimal);
        writer.writeTime('localTime', obj.localTime);
        writer.writeDate('localDate', obj.localDate);
        writer.writeTimestamp('localDateTime', obj.localDateTime);
        writer.writeTimestampWithTimezone('offsetDateTime', obj.offsetDateTime);
        writer.writeNullableInt8('nullableB', obj.nullableB);
        writer.writeNullableBoolean('nullableBool', obj.nullableBool);
        writer.writeNullableInt16('nullableS', obj.nullableS);
        writer.writeNullableInt32('nullableI', obj.nullableI);
        writer.writeNullableInt64('nullableL', obj.nullableL);
        writer.writeNullableFloat32('nullableF', obj.nullableF);
        writer.writeNullableFloat64('nullableD', obj.nullableD);
    }
}

const createCompactGenericRecord = (mainDTO) => {
    const innerDTO = mainDTO.p;
    const namedRecords = new Array(innerDTO.nn.length);
    let i = 0;
    for (const named of innerDTO.nn) {
        namedRecords[i] = GenericRecords.compact('named', {
            name: Fields.string,
            myint: Fields.int32
        },
        {
            name: named.name,
            myint: named.myint
        });
        i++;
    }
    const innerRecord = GenericRecords.compact('inner', {
            bb: Fields.arrayOfInt8,
            ss: Fields.arrayOfInt16,
            ii: Fields.arrayOfInt32,
            ll: Fields.arrayOfInt64,
            ff: Fields.arrayOfFloat32,
            dd: Fields.arrayOfFloat64,
            nn: Fields.arrayOfGenericRecord,
            bigDecimals: Fields.arrayOfDecimal,
            localTimes: Fields.arrayOfTime,
            localDates: Fields.arrayOfDate,
            localDateTimes: Fields.arrayOfTimestamp,
            offsetDateTimes: Fields.arrayOfTimestampWithTimezone
    },
    {
        bb: innerDTO.bb,
        ss: innerDTO.ss,
        ii: innerDTO.ii,
        ll: innerDTO.ll,
        ff: innerDTO.ff,
        dd: innerDTO.dd,
        nn: namedRecords,
        bigDecimals: innerDTO.bigDecimals,
        localTimes: innerDTO.localTimes,
        localDates: innerDTO.localDates,
        localDateTimes: innerDTO.localDateTimes,
        offsetDateTimes: innerDTO.offsetDateTimes,
    });

    return GenericRecords.compact('main', {
            b: Fields.int8,
            bool: Fields.boolean,
            s: Fields.int16,
            i: Fields.int32,
            l: Fields.int64,
            f: Fields.float32,
            d: Fields.float64,
            str: Fields.string,
            bigDecimal: Fields.decimal,
            p: Fields.genericRecord,
            localTime: Fields.time,
            localDate: Fields.date,
            localDateTime: Fields.timestamp,
            offsetDateTime: Fields.timestampWithTimezone,
            nullable_b: Fields.nullableInt8,
            nullable_bool: Fields.nullableBoolean,
            nullable_s: Fields.nullableInt16,
            nullable_i: Fields.nullableInt32,
            nullable_l: Fields.nullableInt64,
            nullable_f: Fields.nullableFloat32,
            nullable_d: Fields.nullableFloat64
    },
    {
            b: mainDTO.b,
            bool: mainDTO.bool,
            s: mainDTO.s,
            i: mainDTO.i,
            l: mainDTO.l,
            f: mainDTO.f,
            d: mainDTO.d,
            str: mainDTO.str,
            bigDecimal: mainDTO.bigDecimal,
            p: innerRecord,
            localTime: mainDTO.localTime,
            localDate: mainDTO.localDate,
            localDateTime: mainDTO.localDateTime,
            offsetDateTime: mainDTO.offsetDateTime,
            nullable_b: mainDTO.nullable_b,
            nullable_bool: mainDTO.nullable_bool,
            nullable_s: mainDTO.nullable_s,
            nullable_i: mainDTO.nullable_i,
            nullable_l: mainDTO.nullable_l,
            nullable_f: mainDTO.nullable_f,
            nullable_d: mainDTO.nullable_d
    });
};

const serialize = async (serializationService, obj) => {
    try {
        return serializationService.toData(obj);
    } catch (e) {
        if (e instanceof SchemaNotReplicatedError) {
            await serializationService.schemaService.put(e.schema);
        }
        return await serialize(serializationService, obj);
    }
};

module.exports = {
    serialize,
    createCompactGenericRecord,
    NamedDTOSerializer,
    InnerDTOSerializer,
    MainDTOSerializer,
    createSerializationService,
    createMainDTO,
    Bits,
    BitsSerializer,
    Employee,
    EmployeeSerializer,
    Employer,
    EmployerSerializer,
    HIRING_STATUS
};
