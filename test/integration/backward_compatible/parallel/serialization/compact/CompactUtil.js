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

const { SerializationConfigImpl } = require('../../../../../../lib');
const { SerializationServiceV1 } = require('../../../../../../lib/serialization/SerializationService');
const Long = require('long');
const {
    BigDecimal, LocalTime, LocalDate, LocalDateTime, OffsetDateTime, FieldKind, GenericRecords
} = require('../../../../../../lib');
const { FieldOperations } = require('../../../../../../lib/serialization/generic_record/FieldOperations');
const Fields = require('../../../../../../lib/serialization/generic_record/Fields');
const { SchemaNotReplicatedError } = require('../../../../../../lib/core/HazelcastError');

const mimicSchemaReplication = (schemaService1, schemaService2) => {
    schemaService1.schemas = {...schemaService1.schemas, ...schemaService2.schemas};
    schemaService2.schemas = {...schemaService1.schemas, ...schemaService2.schemas};
};

class Nested {
    constructor(name, employee) {
        this.name = name;
        this.employee = employee;
    }
}

class NestedSerializer {
    constructor() {
        this.class = Nested;
        this.typeName = 'Nested';
    }

    read(reader) {
        const age = reader.readString('name');
        const employee = reader.readCompact('employee');
        return new Nested(age, employee);
    }

    write(writer, value) {
        writer.writeString('age', value.age);
        writer.writeCompact('employee', value.employee);
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
        this.class = Employee;
        this.typeName = 'Employee';
    }

    read(reader) {
        const age = reader.readInt32OrDefault('age', 0);
        const id = reader.readInt64OrDefault('id', Long.ZERO);
        return new Employee(age, id);
    }

    write(writer, value) {
        writer.writeInt32('age', value.age);
        writer.writeInt64('id', value.id);
    }
}

class NonCompactClass {
    constructor(a, b) {
        this.a = a;
        this.b = b;
    }
}

const objects = [{}, {a: 1}, new NonCompactClass(1, Long.ONE)];
const numbers = [1, 2, 1.123123, -1.32312, 0, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];
const buffers = [Buffer.from([1, 2]), Buffer.from([]), [], Buffer.from([1]), null];
const strings = ['1', 'asdasd', null, ''];
const arrayOfStrings = [[...strings], null, []];
const longs = [Long.ONE, Long.ZERO, Long.fromNumber(122)];
const nullableLongs = [...longs, null];
const arrayOfLongs = [[...longs], [], null];
const arrayOfNullableLongs = [[...nullableLongs], ...arrayOfLongs, [], null, [Long.ONE, null], [null, null], [null]];
const booleans = [true, false];
const nullableNumbers = [...numbers, null];
const nullableBooleans = [...booleans, null];
const bigDecimals = [BigDecimal.fromString('111.1231231231231231231111131231231233123'), BigDecimal.fromString('0'), null];
const arrayOfBigDecimals = [[...bigDecimals], null, []];
const localDates = [new LocalDate(2022, 12, 12), null];
const localTimes = [new LocalTime(12, 20, 20, 1212), null];
const localDateTimes = [new LocalDateTime(new LocalDate(2022, 12, 12), new LocalTime(12, 20, 20, 1212)), null];
const offsetDateTimes = [
    new OffsetDateTime(new LocalDateTime(new LocalDate(2022, 12, 12), new LocalTime(12, 20, 20, 1212)), 10800), null
];
const arrayOfNumbers = [[], [1, 2, 1.123123], [-1.32312, 0], [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER], null];
const arrayOfBooleans = [[true], [false, true], null, []];
const arrayOfNullableNumbers = [[...nullableNumbers], ...arrayOfNumbers, [1, 2, 3, null], [null, null], [null], null, []];
const arrayOfNullableBooleans = [[...nullableBooleans], ...arrayOfBooleans, [true, null], [null], [null, null], null, []];
const arrayOfLocalDates = [[], [new LocalDate(2022, 12, 12)], [new LocalDate(2022, 12, 12), new LocalDate(2021, 12, 12)], null];
const arrayOfLocalTimes = [[], [new LocalTime(12, 20, 20, 1212), new LocalTime(10, 20, 20, 1212)], null];
const arrayOfLocalDateTimes = [[],
    [new LocalDateTime(new LocalDate(2022, 12, 12), new LocalTime(12, 20, 20, 1212)),
        new LocalDateTime(new LocalDate(2012, 12, 12), new LocalTime(10, 20, 20, 1212))], null];
const arrayOfOffsetDateTimes = [[], [
    new OffsetDateTime(new LocalDateTime(new LocalDate(2022, 12, 12), new LocalTime(12, 20, 20, 1212)), 10800),
    new OffsetDateTime(new LocalDateTime(new LocalDate(12, 12, 12), new LocalTime(2, 20, 20, 2)), 3)
], null];

const genericRecords = [
    GenericRecords.compact('a', {foo: Fields.INT8}, {foo: 1}), null, GenericRecords.compact('b', {bar: Fields.INT16}, {bar: 2})
];
const arrayOfGenericRecords = [[...genericRecords], [], null, [GenericRecords.compact('c', {}, {})]];
const all = [...objects, ...numbers, ...strings, ...arrayOfStrings, ...longs, ...nullableLongs, ...arrayOfLongs,
    ...arrayOfNullableLongs, ...booleans, ...nullableNumbers, ...nullableBooleans, ...bigDecimals, ...arrayOfBigDecimals,
    ...localDates, ...localTimes, ...localDateTimes, ...offsetDateTimes, ...arrayOfNumbers, ...arrayOfBooleans,
    ...arrayOfNullableNumbers, ...arrayOfNullableBooleans, ...arrayOfLocalDates, ...arrayOfLocalTimes, ...arrayOfLocalDateTimes,
    ...arrayOfOffsetDateTimes, ...genericRecords, ...arrayOfGenericRecords
];

const isEmptyArray = (value) => Array.isArray(value) && value.length === 0;
const isAllNullArray = (value) => {
    if (Array.isArray(value)) {
        let seenNonNull = false;
        for (const item of value) {
            if (item !== null) {
                seenNonNull = true;
            }
        }
        return !seenNonNull;
    }
    return false;
};

const validationTestParams= {
    // The first array in value holds valid values, the second holds invalid values.
    'Fields.BOOLEAN': {values: [
        all.filter(value => booleans.includes(value)),
        all.filter(value => !booleans.includes(value))], field: Fields.BOOLEAN},
    'Fields.ARRAY_OF_BOOLEAN': {values: [
        all.filter(value => arrayOfBooleans.includes(value)),
        all.filter(value => !arrayOfBooleans.includes(value) && !isEmptyArray(value))], field: Fields.ARRAY_OF_BOOLEAN},
    'Fields.INT8': {values: [
        all.filter(value => numbers.includes(value)),
        all.filter(value => !numbers.includes(value))], field: Fields.INT8},
    'Fields.ARRAY_OF_INT8': {values: [
        all.filter(value => buffers.includes(value)),
        all.filter(value => !buffers.includes(value) && !isEmptyArray(value))], field: Fields.ARRAY_OF_INT8},
    'Fields.INT16': {values: [
        all.filter(value => numbers.includes(value)),
        all.filter(value => !numbers.includes(value))], field: Fields.INT16},
    'Fields.ARRAY_OF_INT16': {values: [
        all.filter(value => arrayOfNumbers.includes(value)),
        all.filter(value => !arrayOfNumbers.includes(value) && !isEmptyArray(value))], field: Fields.ARRAY_OF_INT16},
    'Fields.INT32': {values: [
        all.filter(value => numbers.includes(value)),
        all.filter(value => !numbers.includes(value))], field: Fields.INT32},
    'Fields.ARRAY_OF_INT32': {values: [
        all.filter(value => arrayOfNumbers.includes(value)),
        all.filter(value => !arrayOfNumbers.includes(value) && !isEmptyArray(value))
    ], field: Fields.ARRAY_OF_INT32},
    'Fields.INT64': {values: [
        all.filter(value => longs.includes(value)),
        all.filter(value => !longs.includes(value))], field: Fields.INT64},
    'Fields.ARRAY_OF_INT64': {values: [
        all.filter(value => arrayOfLongs.includes(value)),
        all.filter(value => !arrayOfLongs.includes(value) && !isEmptyArray(value))], field: Fields.ARRAY_OF_INT64},
    'Fields.FLOAT32': {values: [
        all.filter(value => numbers.includes(value)),
        all.filter(value => !numbers.includes(value))], field: Fields.FLOAT32},
    'Fields.ARRAY_OF_FLOAT32': {values: [
        all.filter(value => arrayOfNumbers.includes(value)),
        all.filter(value => !arrayOfNumbers.includes(value) && !isEmptyArray(value))], field: Fields.ARRAY_OF_FLOAT32},
    'Fields.FLOAT64': {values: [
        all.filter(value => numbers.includes(value)),
        all.filter(value => !numbers.includes(value))], field: Fields.FLOAT64},
    'Fields.ARRAY_OF_FLOAT64': {values: [
        all.filter(value => arrayOfNumbers.includes(value)),
        all.filter(value => !arrayOfNumbers.includes(value) && !isEmptyArray(value))], field: Fields.ARRAY_OF_FLOAT64},
    'Fields.STRING': {values: [
        all.filter(value => strings.includes(value)),
        all.filter(value => !strings.includes(value))], field: Fields.STRING},
    'Fields.ARRAY_OF_STRING': {values: [
        all.filter(value => arrayOfStrings.includes(value)),
        all.filter(value => !arrayOfStrings.includes(value) && !isEmptyArray(value) && !isAllNullArray(value))
    ], field: Fields.ARRAY_OF_STRING},
    'Fields.DECIMAL': {values: [
        all.filter(value => bigDecimals.includes(value)),
        all.filter(value => !bigDecimals.includes(value))], field: Fields.DECIMAL},
    'Fields.ARRAY_OF_DECIMAL': {values: [
        all.filter(value => arrayOfBigDecimals.includes(value)),
        all.filter(value => !arrayOfBigDecimals.includes(value) && !isEmptyArray(value) && !isAllNullArray(value))
    ], field: Fields.ARRAY_OF_DECIMAL},
    'Fields.TIME': {values: [
        all.filter(value => localTimes.includes(value)),
        all.filter(value => !localTimes.includes(value))], field: Fields.TIME},
    'Fields.ARRAY_OF_TIME': {values: [
        all.filter(value => arrayOfLocalTimes.includes(value)),
        all.filter(value => !arrayOfLocalTimes.includes(value) && !isEmptyArray(value) && !isAllNullArray(value))
    ], field: Fields.ARRAY_OF_TIME},
    'Fields.DATE': {values: [
        all.filter(value => localDates.includes(value)),
        all.filter(value => !localDates.includes(value))], field: Fields.DATE},
    'Fields.ARRAY_OF_DATE': {values: [
        all.filter(value => arrayOfLocalDates.includes(value)),
        all.filter(value => !arrayOfLocalDates.includes(value) && !isEmptyArray(value) && !isAllNullArray(value))
    ], field: Fields.ARRAY_OF_DATE},
    'Fields.TIMESTAMP': {values: [
        all.filter(value => localDateTimes.includes(value)),
        all.filter(value => !localDateTimes.includes(value))], field: Fields.TIMESTAMP},
    'Fields.ARRAY_OF_TIMESTAMP': {values: [
        all.filter(value => arrayOfLocalDateTimes.includes(value)),
        all.filter(value => !arrayOfLocalDateTimes.includes(value) && !isEmptyArray(value) && !isAllNullArray(value))
    ], field: Fields.ARRAY_OF_TIMESTAMP},
    'Fields.TIMESTAMP_WITH_TIMEZONE': {values: [
        all.filter(value => offsetDateTimes.includes(value)),
        all.filter(value => !offsetDateTimes.includes(value))], field: Fields.TIMESTAMP_WITH_TIMEZONE},
    'Fields.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE': {values: [
        all.filter(value => arrayOfOffsetDateTimes.includes(value)),
        all.filter(value => !arrayOfOffsetDateTimes.includes(value) && !isEmptyArray(value) && !isAllNullArray(value))
    ], field: Fields.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE},
    'Fields.NULLABLE_BOOLEAN': {values: [
        all.filter(value => nullableBooleans.includes(value)),
        all.filter(value => !nullableBooleans.includes(value))], field: Fields.NULLABLE_BOOLEAN},
    'Fields.ARRAY_OF_NULLABLE_BOOLEAN': {values: [
        all.filter(value => arrayOfNullableBooleans.includes(value)),
        all.filter(value => !arrayOfNullableBooleans.includes(value) && !isEmptyArray(value) && !isAllNullArray(value))
    ], field: Fields.ARRAY_OF_NULLABLE_BOOLEAN},
    'Fields.NULLABLE_INT8': {values: [
        all.filter(value => nullableNumbers.includes(value)),
        all.filter(value => !nullableNumbers.includes(value))], field: Fields.NULLABLE_INT8},
    'Fields.ARRAY_OF_NULLABLE_INT8': {values: [
        all.filter(value => arrayOfNullableNumbers.includes(value)),
        all.filter(value => !arrayOfNullableNumbers.includes(value) && !isEmptyArray(value) && !isAllNullArray(value))
    ], field: Fields.ARRAY_OF_NULLABLE_INT8},
    'Fields.NULLABLE_INT16': {values: [
        all.filter(value => nullableNumbers.includes(value)),
        all.filter(value => !nullableNumbers.includes(value))], field: Fields.NULLABLE_INT16},
    'Fields.ARRAY_OF_NULLABLE_INT16': {values: [
        all.filter(value => arrayOfNullableNumbers.includes(value)),
        all.filter(value => !arrayOfNullableNumbers.includes(value) && !isEmptyArray(value) && !isAllNullArray(value))
    ], field: Fields.ARRAY_OF_NULLABLE_INT16},
    'Fields.NULLABLE_INT32': {values: [
        all.filter(value => nullableNumbers.includes(value)),
        all.filter(value => !nullableNumbers.includes(value))], field: Fields.NULLABLE_INT32},
    'Fields.ARRAY_OF_NULLABLE_INT32': {values: [
        all.filter(value => arrayOfNullableNumbers.includes(value)),
        all.filter(value => !arrayOfNullableNumbers.includes(value) && !isEmptyArray(value) && !isAllNullArray(value))
    ], field: Fields.ARRAY_OF_NULLABLE_INT32},
    'Fields.NULLABLE_INT64': {values: [
        all.filter(value => nullableLongs.includes(value)),
        all.filter(value => !nullableLongs.includes(value))], field: Fields.NULLABLE_INT64},
    'Fields.ARRAY_OF_NULLABLE_INT64': {values: [
        all.filter(value => arrayOfNullableLongs.includes(value)),
        all.filter(value => !arrayOfNullableLongs.includes(value) && !isEmptyArray(value) && !isAllNullArray(value))
    ], field: Fields.ARRAY_OF_NULLABLE_INT64},
    'Fields.NULLABLE_FLOAT32': {values: [
        all.filter(value => nullableNumbers.includes(value)),
        all.filter(value => !nullableNumbers.includes(value))], field: Fields.NULLABLE_FLOAT32},
    'Fields.ARRAY_OF_NULLABLE_FLOAT32': {values: [
        all.filter(value => arrayOfNullableNumbers.includes(value)),
        all.filter(value => !arrayOfNullableNumbers.includes(value) && !isEmptyArray(value) && !isAllNullArray(value))
    ], field: Fields.ARRAY_OF_NULLABLE_FLOAT32},
    'Fields.NULLABLE_FLOAT64': {values: [
        all.filter(value => nullableNumbers.includes(value)),
        all.filter(value => !nullableNumbers.includes(value))], field: Fields.NULLABLE_FLOAT64},
    'Fields.ARRAY_OF_NULLABLE_FLOAT64': {values: [
        all.filter(value => arrayOfNullableNumbers.includes(value)),
        all.filter(value => !arrayOfNullableNumbers.includes(value) && !isEmptyArray(value) && !isAllNullArray(value))
    ], field: Fields.ARRAY_OF_NULLABLE_FLOAT64},
    'Fields.GENERIC_RECORD': {values: [
        all.filter(value => genericRecords.includes(value)),
        all.filter(value => !genericRecords.includes(value))], field: Fields.GENERIC_RECORD},
    'Fields.ARRAY_OF_GENERIC_RECORD': {values: [
        all.filter(value => arrayOfGenericRecords.includes(value)),
        all.filter(value => !arrayOfGenericRecords.includes(value) && !isEmptyArray(value) && !isAllNullArray(value))
    ], field: Fields.ARRAY_OF_GENERIC_RECORD},
};

class EmployeeDTO {
    constructor(age, id) {
        this.age = age; // int32
        this.id = id; // int64
    }
}

class EmployeeDTOSerializer {
    constructor() {
        this.class = EmployeeDTO; // used to match a js object to serialize with this serializer
        this.typeName = 'example.serialization.EmployeeDTO'; // used to match schema's typeName with serializer
    }

    read(reader) {
        const age = reader.readInt32('age');
        const id = reader.readInt64('id');
        return new EmployeeDTO(age, id);
    }

    write(writer, instance) {
        writer.writeInt32('age', instance.age);
        writer.writeInt64('id', instance.id);
    }
}

class InMemorySchemaService {
    constructor() {
        this.schemas = {};
    }

    get(schemaId) {
        return this.schemas[schemaId.toString()];
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
        this.class = Bits;
        this.typeName = 'Bits';
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
        this.class = Employer;
        this.typeName = 'Employer';
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
    serializationConfig.compact.serializers = compactSerializers;
    const schemaService = new InMemorySchemaService();

    return {
        serializationService: new SerializationServiceV1(serializationConfig, schemaService),
        schemaService
    };
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
        strstr,
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
        this.strstr = strstr;
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
        inner,
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
        this.inner = inner;
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

const supportedFields = [];

for (const fieldKindStr in FieldKind) {
    const fieldKind = +fieldKindStr;
    if (!isNaN(fieldKind)) {
        supportedFields.push(fieldKind);
    }
}

const fixedFieldToNullableFixedField = {
    [FieldKind.BOOLEAN]: FieldKind.NULLABLE_BOOLEAN,
    [FieldKind.INT8]: FieldKind.NULLABLE_INT8,
    [FieldKind.INT16]: FieldKind.NULLABLE_INT16,
    [FieldKind.INT32]: FieldKind.NULLABLE_INT32,
    [FieldKind.INT64]: FieldKind.NULLABLE_INT64,
    [FieldKind.FLOAT32]: FieldKind.NULLABLE_FLOAT32,
    [FieldKind.FLOAT64]: FieldKind.NULLABLE_FLOAT64,
};

const fixedNullableFieldToFixedField = {
    [FieldKind.NULLABLE_BOOLEAN]: FieldKind.BOOLEAN,
    [FieldKind.NULLABLE_INT8]: FieldKind.INT8,
    [FieldKind.NULLABLE_INT16]: FieldKind.INT16,
    [FieldKind.NULLABLE_INT32]: FieldKind.INT32,
    [FieldKind.NULLABLE_INT64]: FieldKind.INT64,
    [FieldKind.NULLABLE_FLOAT32]: FieldKind.FLOAT32,
    [FieldKind.NULLABLE_FLOAT64]: FieldKind.FLOAT64,
};

const fixedSizedArrayToNullableFixedSizeArray = {
    [FieldKind.ARRAY_OF_BOOLEAN]: FieldKind.ARRAY_OF_NULLABLE_BOOLEAN,
    [FieldKind.ARRAY_OF_INT8]: FieldKind.ARRAY_OF_NULLABLE_INT8,
    [FieldKind.ARRAY_OF_INT16]: FieldKind.ARRAY_OF_NULLABLE_INT16,
    [FieldKind.ARRAY_OF_INT32]: FieldKind.ARRAY_OF_NULLABLE_INT32,
    [FieldKind.ARRAY_OF_INT64]: FieldKind.ARRAY_OF_NULLABLE_INT64,
    [FieldKind.ARRAY_OF_FLOAT32]: FieldKind.ARRAY_OF_NULLABLE_FLOAT32,
    [FieldKind.ARRAY_OF_FLOAT64]: FieldKind.ARRAY_OF_NULLABLE_FLOAT64,
};

const nullableFixedSizeArrayToFixedSizeArray = {
    [FieldKind.ARRAY_OF_NULLABLE_BOOLEAN]: FieldKind.ARRAY_OF_BOOLEAN,
    [FieldKind.ARRAY_OF_NULLABLE_INT8]: FieldKind.ARRAY_OF_INT8,
    [FieldKind.ARRAY_OF_NULLABLE_INT16]: FieldKind.ARRAY_OF_INT16,
    [FieldKind.ARRAY_OF_NULLABLE_INT32]: FieldKind.ARRAY_OF_INT32,
    [FieldKind.ARRAY_OF_NULLABLE_INT64]: FieldKind.ARRAY_OF_INT64,
    [FieldKind.ARRAY_OF_NULLABLE_FLOAT32]: FieldKind.ARRAY_OF_FLOAT32,
    [FieldKind.ARRAY_OF_NULLABLE_FLOAT64]: FieldKind.ARRAY_OF_FLOAT64,
};

const nullableFixedSizeFields = [];
const fixedSizeFields = [];
const varSizeFields = [];

for (const fieldKind of supportedFields) {
    if (FieldOperations.ALL[fieldKind].kindSizeInBytes() === FieldOperations.VARIABLE_SIZE) {
        varSizeFields.push(fieldKind);
    } else {
        nullableFixedSizeFields.push(fixedFieldToNullableFixedField[fieldKind]);
        fixedSizeFields.push(fieldKind);
    }
}

class Flexible {
    constructor(fields) {
        for (const field in fields) {
            this[field] = fields[field].value;
        }
    }
}

class FlexibleSerializer {
    constructor(fieldKinds, readerFieldNameMap = {}, writerFieldNameMap = {}, useDefaultValue = false) {
        this.useDefaultValue = useDefaultValue;
        this.readerFieldNameMap = readerFieldNameMap;
        this.writerFieldNameMap = writerFieldNameMap;
        this.fieldKinds = fieldKinds;
        this.class = Flexible;
        this.typeName = 'Flexible';
    }

    read(reader) {
        const fields = {};
        for (const fieldKind of this.fieldKinds) {
            const baseName = FieldKind[fieldKind];
            const fieldName = Object.prototype.hasOwnProperty.call(this.readerFieldNameMap, baseName) ?
                this.readerFieldNameMap[baseName] : baseName;
            const defaultValue = this.useDefaultValue ? referenceObjects[baseName].default : undefined;

            switch (fieldKind) {
            case FieldKind.BOOLEAN:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readBoolean(fieldName) :
                    reader.readBooleanOrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.ARRAY_OF_BOOLEAN:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readArrayOfBoolean(fieldName) :
                    reader.readArrayOfBooleanOrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.INT8:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readInt8(fieldName) :
                    reader.readInt8OrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.ARRAY_OF_INT8:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readArrayOfInt8(fieldName) :
                    reader.readArrayOfInt8OrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.INT16:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readInt16(fieldName) :
                    reader.readInt16OrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.ARRAY_OF_INT16:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readArrayOfInt16(fieldName) :
                    reader.readArrayOfInt16OrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.INT32:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readInt32(fieldName) :
                    reader.readInt32OrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.ARRAY_OF_INT32:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readArrayOfInt32(fieldName) :
                    reader.readArrayOfInt32OrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.INT64:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readInt64(fieldName) :
                    reader.readInt64OrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.ARRAY_OF_INT64:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readArrayOfInt64(fieldName) :
                    reader.readArrayOfInt64OrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.FLOAT32:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readFloat32(fieldName) :
                    reader.readFloat32OrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.ARRAY_OF_FLOAT32:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readArrayOfFloat32(fieldName) :
                    reader.readArrayOfFloat32OrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.FLOAT64:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readFloat64(fieldName) :
                    reader.readFloat64OrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.ARRAY_OF_FLOAT64:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readArrayOfFloat64(fieldName) :
                    reader.readArrayOfFloat64OrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.STRING:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readString(fieldName) :
                    reader.readStringOrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.ARRAY_OF_STRING:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readArrayOfString(fieldName) :
                    reader.readArrayOfStringOrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.DECIMAL:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readDecimal(fieldName) :
                    reader.readDecimalOrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.ARRAY_OF_DECIMAL:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readArrayOfDecimal(fieldName) :
                    reader.readArrayOfDecimalOrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.TIME:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readTime(fieldName) :
                    reader.readTimeOrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.ARRAY_OF_TIME:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readArrayOfTime(fieldName) :
                    reader.readArrayOfTimeOrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.DATE:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readDate(fieldName) :
                    reader.readDateOrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.ARRAY_OF_DATE:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readArrayOfDate(fieldName) :
                    reader.readArrayOfDateOrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.TIMESTAMP:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readTimestamp(fieldName) :
                    reader.readTimestampOrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.ARRAY_OF_TIMESTAMP:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readArrayOfTimestamp(fieldName) :
                    reader.readArrayOfTimestampOrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.TIMESTAMP_WITH_TIMEZONE:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readTimestampWithTimezone(fieldName) :
                    reader.readTimestampWithTimezoneOrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readArrayOfTimestampWithTimezone(fieldName) :
                    reader.readArrayOfTimestampWithTimezoneOrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.COMPACT:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readCompact(fieldName) :
                    reader.readCompactOrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.ARRAY_OF_COMPACT:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readArrayOfCompact(fieldName) :
                    reader.readArrayOfCompactOrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.NULLABLE_BOOLEAN:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readNullableBoolean(fieldName) :
                    reader.readNullableBooleanOrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.ARRAY_OF_NULLABLE_BOOLEAN:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readArrayOfNullableBoolean(fieldName) :
                    reader.readArrayOfNullableBooleanOrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.NULLABLE_INT8:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readNullableInt8(fieldName) :
                    reader.readNullableInt8OrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.ARRAY_OF_NULLABLE_INT8:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readArrayOfNullableInt8(fieldName) :
                    reader.readArrayOfNullableInt8OrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.NULLABLE_INT16:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readNullableInt16(fieldName) :
                    reader.readNullableInt16OrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.ARRAY_OF_NULLABLE_INT16:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readArrayOfNullableInt16(fieldName) :
                    reader.readArrayOfNullableInt16OrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.NULLABLE_INT32:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readNullableInt32(fieldName) :
                    reader.readNullableInt32OrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.ARRAY_OF_NULLABLE_INT32:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readArrayOfNullableInt32(fieldName) :
                    reader.readArrayOfNullableInt32OrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.NULLABLE_INT64:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readNullableInt64(fieldName) :
                    reader.readNullableInt64OrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.ARRAY_OF_NULLABLE_INT64:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readArrayOfNullableInt64(fieldName) :
                    reader.readArrayOfNullableInt64OrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.NULLABLE_FLOAT32:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readNullableFloat32(fieldName) :
                    reader.readNullableFloat32OrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.ARRAY_OF_NULLABLE_FLOAT32:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readArrayOfNullableFloat32(fieldName) :
                    reader.readArrayOfNullableFloat32OrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.NULLABLE_FLOAT64:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readNullableFloat64(fieldName) :
                    reader.readNullableFloat64OrDefault(fieldName, defaultValue)};
                break;
            case FieldKind.ARRAY_OF_NULLABLE_FLOAT64:
                fields[fieldName] = {value: !this.useDefaultValue ? reader.readArrayOfNullableFloat64(fieldName) :
                    reader.readArrayOfNullableFloat64OrDefault(fieldName, defaultValue)};
                break;
            }
        }
        return new Flexible(fields);
    }

    write(writer, instance) {
        for (const fieldKind of this.fieldKinds) {
            const baseName = FieldKind[fieldKind];
            const fieldName = Object.prototype.hasOwnProperty.call(this.writerFieldNameMap, baseName) ?
                this.writerFieldNameMap[baseName] : baseName;
            switch (fieldKind) {
            case FieldKind.BOOLEAN:
                writer.writeBoolean(fieldName, instance[fieldName]);
                break;
            case FieldKind.ARRAY_OF_BOOLEAN:
                writer.writeArrayOfBoolean(fieldName, instance[fieldName]);
                break;
            case FieldKind.INT8:
                writer.writeInt8(fieldName, instance[fieldName]);
                break;
            case FieldKind.ARRAY_OF_INT8:
                writer.writeArrayOfInt8(fieldName, instance[fieldName]);
                break;
            case FieldKind.INT16:
                writer.writeInt16(fieldName, instance[fieldName]);
                break;
            case FieldKind.ARRAY_OF_INT16:
                writer.writeArrayOfInt16(fieldName, instance[fieldName]);
                break;
            case FieldKind.INT32:
                writer.writeInt32(fieldName, instance[fieldName]);
                break;
            case FieldKind.ARRAY_OF_INT32:
                writer.writeArrayOfInt32(fieldName, instance[fieldName]);
                break;
            case FieldKind.INT64:
                writer.writeInt64(fieldName, instance[fieldName]);
                break;
            case FieldKind.ARRAY_OF_INT64:
                writer.writeArrayOfInt64(fieldName, instance[fieldName]);
                break;
            case FieldKind.FLOAT32:
                writer.writeFloat32(fieldName, instance[fieldName]);
                break;
            case FieldKind.ARRAY_OF_FLOAT32:
                writer.writeArrayOfFloat32(fieldName, instance[fieldName]);
                break;
            case FieldKind.FLOAT64:
                writer.writeFloat64(fieldName, instance[fieldName]);
                break;
            case FieldKind.ARRAY_OF_FLOAT64:
                writer.writeArrayOfFloat64(fieldName, instance[fieldName]);
                break;
            case FieldKind.STRING:
                writer.writeString(fieldName, instance[fieldName]);
                break;
            case FieldKind.ARRAY_OF_STRING:
                writer.writeArrayOfString(fieldName, instance[fieldName]);
                break;
            case FieldKind.DECIMAL:
                writer.writeDecimal(fieldName, instance[fieldName]);
                break;
            case FieldKind.ARRAY_OF_DECIMAL:
                writer.writeArrayOfDecimal(fieldName, instance[fieldName]);
                break;
            case FieldKind.TIME:
                writer.writeTime(fieldName, instance[fieldName]);
                break;
            case FieldKind.ARRAY_OF_TIME:
                writer.writeArrayOfTime(fieldName, instance[fieldName]);
                break;
            case FieldKind.DATE:
                writer.writeDate(fieldName, instance[fieldName]);
                break;
            case FieldKind.ARRAY_OF_DATE:
                writer.writeArrayOfDate(fieldName, instance[fieldName]);
                break;
            case FieldKind.TIMESTAMP:
                writer.writeTimestamp(fieldName, instance[fieldName]);
                break;
            case FieldKind.ARRAY_OF_TIMESTAMP:
                writer.writeArrayOfTimestamp(fieldName, instance[fieldName]);
                break;
            case FieldKind.TIMESTAMP_WITH_TIMEZONE:
                writer.writeTimestampWithTimezone(fieldName, instance[fieldName]);
                break;
            case FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE:
                writer.writeArrayOfTimestampWithTimezone(fieldName, instance[fieldName]);
                break;
            case FieldKind.COMPACT:
                writer.writeCompact(fieldName, instance[fieldName]);
                break;
            case FieldKind.ARRAY_OF_COMPACT:
                writer.writeArrayOfCompact(fieldName, instance[fieldName]);
                break;
            case FieldKind.NULLABLE_BOOLEAN:
                writer.writeNullableBoolean(fieldName, instance[fieldName]);
                break;
            case FieldKind.ARRAY_OF_NULLABLE_BOOLEAN:
                writer.writeArrayOfNullableBoolean(fieldName, instance[fieldName]);
                break;
            case FieldKind.NULLABLE_INT8:
                writer.writeNullableInt8(fieldName, instance[fieldName]);
                break;
            case FieldKind.ARRAY_OF_NULLABLE_INT8:
                writer.writeArrayOfNullableInt8(fieldName, instance[fieldName]);
                break;
            case FieldKind.NULLABLE_INT16:
                writer.writeNullableInt16(fieldName, instance[fieldName]);
                break;
            case FieldKind.ARRAY_OF_NULLABLE_INT16:
                writer.writeArrayOfNullableInt16(fieldName, instance[fieldName]);
                break;
            case FieldKind.NULLABLE_INT32:
                writer.writeNullableInt32(fieldName, instance[fieldName]);
                break;
            case FieldKind.ARRAY_OF_NULLABLE_INT32:
                writer.writeArrayOfNullableInt32(fieldName, instance[fieldName]);
                break;
            case FieldKind.NULLABLE_INT64:
                writer.writeNullableInt64(fieldName, instance[fieldName]);
                break;
            case FieldKind.ARRAY_OF_NULLABLE_INT64:
                writer.writeArrayOfNullableInt64(fieldName, instance[fieldName]);
                break;
            case FieldKind.NULLABLE_FLOAT32:
                writer.writeNullableFloat32(fieldName, instance[fieldName]);
                break;
            case FieldKind.ARRAY_OF_NULLABLE_FLOAT32:
                writer.writeArrayOfNullableFloat32(fieldName, instance[fieldName]);
                break;
            case FieldKind.NULLABLE_FLOAT64:
                writer.writeNullableFloat64(fieldName, instance[fieldName]);
                break;
            case FieldKind.ARRAY_OF_NULLABLE_FLOAT64:
                writer.writeArrayOfNullableFloat64(fieldName, instance[fieldName]);
                break;
            }
        }
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
        [0.6542999744415283, -3.559999942779541, 45.66999816894531], [456.456, 789.789, 321.321], nn,
        ['string1', 'string2', 'string3'], [BigDecimal.fromString('12345'), BigDecimal.fromString('123456')],
        [getNowLocalTime(), getNowLocalTime()], [getNowLocalDate(), getNowLocalDate()],
        [LocalDateTime.fromDate(new Date(2021, 8))],
        [OffsetDateTime.fromDate(new Date(2021, 8), 0)], [true, false, null], [1, 2, 3, null], [3, 4, 5, null],
        [9, 8, 7, 6, null],
        [Long.fromNumber(0), Long.fromNumber(1), Long.fromNumber(5), Long.fromNumber(7), Long.fromNumber(9), Long.fromNumber(11)],
        [0.6542999744415283, -3.559999942779541, 45.66999816894531], [456.456, 789.789, 321.321],
        [getNowLocalTime(), getNowLocalTime()], [getNowLocalDate(), getNowLocalDate(), null],
        [LocalDateTime.fromDate(new Date(2021, 8)), null], [OffsetDateTime.fromDate(new Date(2021, 8), 0)],
    );
    return new MainDTO(
        113, true, -500, 56789, Long.fromNumber(-50992225), 900.5678100585938,
        -897543.3678909, 'this is main object created for testing!', inner,
        BigDecimal.fromString('12312313'), getNowLocalTime(), getNowLocalDate(),
        LocalDateTime.fromDate(new Date(2021, 8)), OffsetDateTime.fromDate(new Date(2021, 8), 0),
        113, true, -500, 56789, Long.fromNumber(-50992225), 900.5678100585938, -897543.3678909
    );
};

class InnerDTOSerializer {
    constructor() {
        this.class = InnerDTO;
        this.typeName = 'InnerDTO';
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
        const strstr = reader.readArrayOfString('strstr');
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
            strstr,
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
        writer.writeArrayOfString('strstr', obj.strstr);
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
        this.class = NamedDTO;
        this.typeName = 'NamedDTO';
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

class NodeDTO {
    constructor(id, child) {
        this.id = id;
        this.child = child;
    }
}

class NodeDTOSerializer {
    constructor() {
        this.class = NodeDTO;
        this.typeName = 'NodeDTO';
    }

    read(reader) {
        const id = reader.readInt32('id');
        const child = reader.readCompact('child');

        return new NodeDTO(id, child);
    }

    write(writer, obj) {
        writer.writeInt32('id', obj.id);
        writer.writeCompact('child', obj.child);
    }
}

class MainDTOSerializer {
    constructor() {
        this.class = MainDTO;
        this.typeName = 'MainDTO';
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
        const inner = reader.readCompact('inner');
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
            b, bool, s, i, l, f, d, str, inner, bigDecimal, localTime, localDate, localDateTime,
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
        writer.writeCompact('inner', obj.inner);
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

class MainDTOSerializerWithDefaults {
    constructor() {
        this.class = MainDTO;
        this.typeName = 'MainDTO';
    }

    read(reader) {
        const b = reader.readInt8OrDefault('b', 0);
        const bool = reader.readBooleanOrDefault('bool', false);
        const s = reader.readInt16OrDefault('s', 0);
        const i = reader.readInt32OrDefault('i', 0);
        const l = reader.readInt64OrDefault('l', 0);
        const f = reader.readFloat32OrDefault('f', 0);
        const d = reader.readFloat64OrDefault('d', 0);
        const str = reader.readStringOrDefault('str', '');
        const inner = reader.readCompactOrDefault('inner', null);
        const bigDecimal = reader.readDecimalOrDefault('bigDecimal', new BigDecimal(0n, 0));
        const localTime = reader.readTimeOrDefault('localTime', new LocalTime(0, 0, 0, 0));
        const localDate = reader.readDateOrDefault('localDate', new LocalDate(0, 1, 1));
        const localDateTime = reader.readTimestampOrDefault('localDateTime',
            new LocalDateTime(new LocalDate(0, 1, 1), new LocalTime(0, 0, 0, 0)));
        const offsetDateTime = reader.readTimestampWithTimezoneOrDefault('offsetDateTime',
            new OffsetDateTime(new LocalDateTime(new LocalDate(0, 1, 1), new LocalTime(0, 0, 0, 0)), 0)
        );
        const nullableB = reader.readNullableInt8OrDefault('nullableB', null);
        const nullableBool = reader.readNullableBooleanOrDefault('nullableBool', null);
        const nullableS = reader.readNullableInt16OrDefault('nullableS', null);
        const nullableI = reader.readNullableInt32OrDefault('nullableI', null);
        const nullableL = reader.readNullableInt64OrDefault('nullableL', null);
        const nullableF = reader.readNullableFloat32OrDefault('nullableF', null);
        const nullableD = reader.readNullableFloat64OrDefault('nullableD', null);

        return new MainDTO(
            b, bool, s, i, l, f, d, str, inner, bigDecimal, localTime, localDate, localDateTime,
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
        writer.writeCompact('inner', obj.inner);
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
    const innerDTO = mainDTO.inner;
    const namedRecords = new Array(innerDTO.nn.length);
    let i = 0;
    for (const named of innerDTO.nn) {
        namedRecords[i] = GenericRecords.compact('named', {
            name: Fields.STRING,
            myint: Fields.INT32
        },
        {
            name: named.name,
            myint: named.myint
        });
        i++;
    }
    const innerRecord = GenericRecords.compact('inner', {
            // Nested field inside nested field
            a: Fields.GENERIC_RECORD,
            bb: Fields.ARRAY_OF_INT8,
            ss: Fields.ARRAY_OF_INT16,
            ii: Fields.ARRAY_OF_INT32,
            ll: Fields.ARRAY_OF_INT64,
            ff: Fields.ARRAY_OF_FLOAT32,
            dd: Fields.ARRAY_OF_FLOAT64,
            nn: Fields.ARRAY_OF_GENERIC_RECORD,
            strstr: Fields.ARRAY_OF_STRING,
            bigDecimals: Fields.ARRAY_OF_DECIMAL,
            localTimes: Fields.ARRAY_OF_TIME,
            localDates: Fields.ARRAY_OF_DATE,
            localDateTimes: Fields.ARRAY_OF_TIMESTAMP,
            offsetDateTimes: Fields.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE
    },
    {
        a: GenericRecords.compact('aa', {b: Fields.STRING}, {b: 'aa'}),
        bb: innerDTO.bb,
        ss: innerDTO.ss,
        ii: innerDTO.ii,
        ll: innerDTO.ll,
        ff: innerDTO.ff,
        dd: innerDTO.dd,
        nn: namedRecords,
        strstr: innerDTO.strstr,
        bigDecimals: innerDTO.bigDecimals,
        localTimes: innerDTO.localTimes,
        localDates: innerDTO.localDates,
        localDateTimes: innerDTO.localDateTimes,
        offsetDateTimes: innerDTO.offsetDateTimes,
    });

    return GenericRecords.compact('main', {
            b: Fields.INT8,
            bool: Fields.BOOLEAN,
            s: Fields.INT16,
            i: Fields.INT32,
            l: Fields.INT64,
            f: Fields.FLOAT32,
            d: Fields.FLOAT64,
            str: Fields.STRING,
            bigDecimal: Fields.DECIMAL,
            inner: Fields.GENERIC_RECORD,
            localTime: Fields.TIME,
            localDate: Fields.DATE,
            localDateTime: Fields.TIMESTAMP,
            offsetDateTime: Fields.TIMESTAMP_WITH_TIMEZONE,
            nullable_b: Fields.NULLABLE_INT8,
            nullable_bool: Fields.NULLABLE_BOOLEAN,
            nullable_s: Fields.NULLABLE_INT16,
            nullable_i: Fields.NULLABLE_INT32,
            nullable_l: Fields.NULLABLE_INT64,
            nullable_f: Fields.NULLABLE_FLOAT32,
            nullable_d: Fields.NULLABLE_FLOAT64
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
            inner: innerRecord,
            localTime: mainDTO.localTime,
            localDate: mainDTO.localDate,
            localDateTime: mainDTO.localDateTime,
            offsetDateTime: mainDTO.offsetDateTime,
            nullable_b: mainDTO.b,
            nullable_bool: mainDTO.bool,
            nullable_s: mainDTO.s,
            nullable_i: mainDTO.i,
            nullable_l: mainDTO.l,
            nullable_f: mainDTO.f,
            nullable_d: mainDTO.d
    });
};

const serialize = async (serializationService, schemaService, obj) => {
    try {
        return serializationService.toData(obj);
    } catch (e) {
        if (e instanceof SchemaNotReplicatedError) {
            await schemaService.put(e.schema);
        }
        return await serialize(serializationService, schemaService, obj);
    }
};

const referenceObjects = {
    [FieldKind[FieldKind.BOOLEAN]]: {default: false, value: true},
    [FieldKind[FieldKind.ARRAY_OF_BOOLEAN]]: {default: [], value: [true, false, true, true, true, false, true, true, false]},
    [FieldKind[FieldKind.INT8]]: {default: 0, value: -32},
    [FieldKind[FieldKind.ARRAY_OF_INT8]]: {default: Buffer.from([]), value: Buffer.from([42, -128, -1, 127])},
    [FieldKind[FieldKind.INT16]]: {default: 0, value: -456},
    [FieldKind[FieldKind.ARRAY_OF_INT16]]: {default: [], value: [-4231, 12343, 0]},
    [FieldKind[FieldKind.INT32]]: {default: 0, value: 21212121},
    [FieldKind[FieldKind.ARRAY_OF_INT32]]: {default: [], value: [-1, 1, 0, 9999999]},
    [FieldKind[FieldKind.INT64]]: {default: Long.ZERO, value: Long.fromNumber(123456789)},
    [FieldKind[FieldKind.ARRAY_OF_INT64]]: {default: [], value: [Long.fromNumber(11), Long.fromNumber(-123456789)]},
    [FieldKind[FieldKind.FLOAT32]]: {default: 0, value: 12.5},
    [FieldKind[FieldKind.ARRAY_OF_FLOAT32]]: {default: [], value: [
        -13.130000114440918,
        12345.669921875,
        0.10000000149011612,
        9876543,
        -99999.9921875,
    ]},
    [FieldKind[FieldKind.FLOAT64]]: {default: 0, value: 12345678.90123},
    [FieldKind[FieldKind.ARRAY_OF_FLOAT64]]: {default: [], value: [-12345.67]},
    [FieldKind[FieldKind.STRING]]: {default: '', value: 'üğişçöa'},
    [FieldKind[FieldKind.ARRAY_OF_STRING]]: {default: [], value: ['17', '😊 😇 🙂', 'abc']},
    [FieldKind[FieldKind.DECIMAL]]: {default: BigDecimal.fromString('0'), value: BigDecimal.fromString('123.456')},
    [FieldKind[FieldKind.ARRAY_OF_DECIMAL]]: {default: [],
         value: [BigDecimal.fromString('0'), BigDecimal.fromString('-123456.789')]},
    [FieldKind[FieldKind.TIME]]: {default: new LocalTime(0, 0, 0, 0), value: new LocalTime(2, 3, 4, 5)},
    [FieldKind[FieldKind.ARRAY_OF_TIME]]: {default: [], value: [new LocalTime(8, 7, 6, 5)]},
    [FieldKind[FieldKind.DATE]]: {default: new LocalDate(0, 1, 1), value: new LocalDate(2022, 1, 1)},
    [FieldKind[FieldKind.ARRAY_OF_DATE]]: {default: [], value: [new LocalDate(2021, 11, 11), new LocalDate(2020, 3, 3)]},
    [FieldKind[FieldKind.TIMESTAMP]]: {default: LocalDateTime.from(0, 1, 1, 0, 0, 0, 0),
         value: LocalDateTime.from(2022, 2, 2, 3, 3, 3, 4000)},
    [FieldKind[FieldKind.ARRAY_OF_TIMESTAMP]]: {default: [], value: [LocalDateTime.from(1990, 2, 12, 13, 14, 54, 98765000)]},
    [FieldKind[FieldKind.TIMESTAMP_WITH_TIMEZONE]]: {default: OffsetDateTime.from(0, 1, 1, 0, 0, 0, 0, 0),
         value: OffsetDateTime.from(200, 10, 10, 16, 44, 42, 12345000, 7200)},
    [FieldKind[FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE]]: {default: [],
         value: [OffsetDateTime.from(2001, 1, 10, 12, 24, 2, 45, -7200)]},
    [FieldKind[FieldKind.COMPACT]]: {default: new Employee(0, Long.ZERO), value: new Employee(42, Long.fromString('42'))},
    [FieldKind[FieldKind.ARRAY_OF_COMPACT]]: {default: [],
         value: [new Employee(42, Long.fromString('42')), new Employee(123, Long.fromString('123'))]},
    [FieldKind[FieldKind.NULLABLE_BOOLEAN]]: {default: null, value: false},
    [FieldKind[FieldKind.ARRAY_OF_NULLABLE_BOOLEAN]]: {default: [], value: [false, false, true]},
    [FieldKind[FieldKind.NULLABLE_INT8]]: {default: null, value: -34},
    [FieldKind[FieldKind.ARRAY_OF_NULLABLE_INT8]]: {default: [], value: [-32, 32]},
    [FieldKind[FieldKind.NULLABLE_INT16]]: {default: null, value: 36},
    [FieldKind[FieldKind.ARRAY_OF_NULLABLE_INT16]]: {default: [], value: [37, -37, 0, 12345]},
    [FieldKind[FieldKind.NULLABLE_INT32]]: {default: null, value: -38},
    [FieldKind[FieldKind.ARRAY_OF_NULLABLE_INT32]]: {default: [], value: [-39, 2134567, -8765432, 39]},
    [FieldKind[FieldKind.NULLABLE_INT64]]: {default: null, value: Long.fromNumber(-4040)},
    [FieldKind[FieldKind.ARRAY_OF_NULLABLE_INT64]]: {default: [],
         value: [1, 41, -1, 12312312312, -9312912391].map(x => Long.fromNumber(x))},
    [FieldKind[FieldKind.NULLABLE_FLOAT32]]: {default: null, value: 42.400001525878906},
    [FieldKind[FieldKind.ARRAY_OF_NULLABLE_FLOAT32]]: {default: [],
        value: [-43.400001525878906, 434.42999267578125]},
    [FieldKind[FieldKind.NULLABLE_FLOAT64]]: {default: null, value: 44.12},
    [FieldKind[FieldKind.ARRAY_OF_NULLABLE_FLOAT64]]: {default: [], value: [45.678, -4567.8, 0.12345]},
};

module.exports = {
    serialize,
    createCompactGenericRecord,
    mimicSchemaReplication,
    createSerializationService,
    createMainDTO,
    validationTestParams,
    referenceObjects,
    varSizeFields,
    nullableFixedSizeFields,
    fixedSizeFields,
    nullableFixedSizeArrayToFixedSizeArray,
    fixedNullableFieldToFixedField,
    fixedFieldToNullableFixedField,
    fixedSizedArrayToNullableFixedSizeArray,
    NodeDTOSerializer,
    NamedDTOSerializer,
    InnerDTOSerializer,
    MainDTOSerializer,
    MainDTOSerializerWithDefaults,
    Flexible,
    FlexibleSerializer,
    supportedFields,
    NodeDTO,
    Bits,
    BitsSerializer,
    Nested,
    NestedSerializer,
    Employee,
    EmployeeSerializer,
    EmployeeDTO,
    EmployeeDTOSerializer,
    Employer,
    EmployerSerializer,
    HIRING_STATUS
};
