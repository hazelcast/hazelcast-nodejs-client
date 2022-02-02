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

const { SerializationConfigImpl } = require('../../../../../../src');
const { SerializationServiceV1 } = require('../../../../../../lib/serialization/SerializationService');
const Long = require('long');
const {
    BigDecimal, LocalTime, LocalDate, LocalDateTime, OffsetDateTime, FieldKind, GenericRecords
} = require('../../../../../../lib');
const { FieldOperations } = require('../../../../../../lib/serialization/generic_record/FieldOperations');
const Fields = require('../../../../../../lib/serialization/generic_record/Field');
const { SchemaNotReplicatedError } = require('../../../../../../lib/core/HazelcastError');

const mimicSchemaReplication = (serializationService1, serializationService2) => {
    serializationService1.schemaService.schemas =
        {...serializationService1.schemaService.schemas, ...serializationService2.schemaService.schemas};
    serializationService2.schemaService.schemas =
        {...serializationService1.schemaService.schemas, ...serializationService2.schemaService.schemas};
};

class EmployeeDTO {
    constructor(age, id) {
        this.age = age; // int32
        this.id = id; // int64
    }
}

class EmployeeDTOSerializer {
    constructor() {
        this.hzClassName = 'EmployeeDTO'; // used to match a js object to serialize with this serializer
        this.hzTypeName = 'example.serialization.EmployeeDTO'; // used to match schema's typeName with serializer
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
        const age = reader.readInt32('age', 0);
        const id = reader.readInt64('id', Long.ZERO);
        return new Employee(age, id);
    }

    write(writer, value) {
        writer.writeInt32('age', value.age);
        writer.writeInt64('id', value.id);
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

const supportedFieldKinds = [];

for (const fieldKindStr in FieldKind) {
    const fieldKind = +fieldKindStr;
    if (!isNaN(fieldKind)) {
        if (
            fieldKind !== FieldKind.CHAR &&
            fieldKind !== FieldKind.ARRAY_OF_CHAR &&
            fieldKind !== FieldKind.ARRAY_OF_PORTABLE &&
            fieldKind !== FieldKind.PORTABLE
        ) {
            supportedFieldKinds.push(fieldKind);
        }
    }
}

const fixedSizeFields = [];
const varSizeFields = [];
for (const fieldKind of supportedFieldKinds) {
    if (FieldOperations.ALL[fieldKind].kindSizeInBytes() === FieldOperations.VARIABLE_SIZE) {
        varSizeFields.push(fieldKind);
    } else {
        fixedSizeFields.push(fieldKind);
    }
}

class Flexible {
    constructor(fields) {
        for (const field in fields) {
            this[field] = fields[field];
        }
    }
}

class FlexibleSerializer {
    constructor(fieldKinds) {
        this.fieldKinds = fieldKinds;
        this.hzClassName = 'Flexible';
    }

    read(reader) {
        const fields = {};
        for (const fieldKind of this.fieldKinds) {
            switch (fieldKind) {
            case FieldKind.BOOLEAN:
                fields[FieldKind[fieldKind]] = reader.readBoolean(FieldKind[fieldKind]);
                break;
            case FieldKind.ARRAY_OF_BOOLEAN:
                fields[FieldKind[fieldKind]] = reader.readArrayOfBoolean(FieldKind[fieldKind]);
                break;
            case FieldKind.INT8:
                fields[FieldKind[fieldKind]] = reader.readInt8(FieldKind[fieldKind]);
                break;
            case FieldKind.ARRAY_OF_INT8:
                fields[FieldKind[fieldKind]] = reader.readArrayOfInt8(FieldKind[fieldKind]);
                break;
            case FieldKind.CHAR:
                throw new Error('Char field is not supported in compact');
            case FieldKind.ARRAY_OF_CHAR:
                throw new Error('Char field is not supported in compact');
            case FieldKind.INT16:
                fields[FieldKind[fieldKind]] = reader.readInt16(FieldKind[fieldKind]);
                break;
            case FieldKind.ARRAY_OF_INT16:
                fields[FieldKind[fieldKind]] = reader.readArrayOfInt16(FieldKind[fieldKind]);
                break;
            case FieldKind.INT32:
                fields[FieldKind[fieldKind]] = reader.readInt32(FieldKind[fieldKind]);
                break;
            case FieldKind.ARRAY_OF_INT32:
                fields[FieldKind[fieldKind]] = reader.readArrayOfInt32(FieldKind[fieldKind]);
                break;
            case FieldKind.INT64:
                fields[FieldKind[fieldKind]] = reader.readInt64(FieldKind[fieldKind]);
                break;
            case FieldKind.ARRAY_OF_INT64:
                fields[FieldKind[fieldKind]] = reader.readArrayOfInt64(FieldKind[fieldKind]);
                break;
            case FieldKind.FLOAT32:
                fields[FieldKind[fieldKind]] = reader.readFloat32(FieldKind[fieldKind]);
                break;
            case FieldKind.ARRAY_OF_FLOAT32:
                fields[FieldKind[fieldKind]] = reader.readArrayOfFloat32(FieldKind[fieldKind]);
                break;
            case FieldKind.FLOAT64:
                fields[FieldKind[fieldKind]] = reader.readFloat64(FieldKind[fieldKind]);
                break;
            case FieldKind.ARRAY_OF_FLOAT64:
                fields[FieldKind[fieldKind]] = reader.readArrayOfFloat64(FieldKind[fieldKind]);
                break;
            case FieldKind.STRING:
                fields[FieldKind[fieldKind]] = reader.readString(FieldKind[fieldKind]);
                break;
            case FieldKind.ARRAY_OF_STRING:
                fields[FieldKind[fieldKind]] = reader.readArrayOfString(FieldKind[fieldKind]);
                break;
            case FieldKind.DECIMAL:
                fields[FieldKind[fieldKind]] = reader.readDecimal(FieldKind[fieldKind]);
                break;
            case FieldKind.ARRAY_OF_DECIMAL:
                fields[FieldKind[fieldKind]] = reader.readArrayOfDecimal(FieldKind[fieldKind]);
                break;
            case FieldKind.TIME:
                fields[FieldKind[fieldKind]] = reader.readTime(FieldKind[fieldKind]);
                break;
            case FieldKind.ARRAY_OF_TIME:
                fields[FieldKind[fieldKind]] = reader.readArrayOfTime(FieldKind[fieldKind]);
                break;
            case FieldKind.DATE:
                fields[FieldKind[fieldKind]] = reader.readDate(FieldKind[fieldKind]);
                break;
            case FieldKind.ARRAY_OF_DATE:
                fields[FieldKind[fieldKind]] = reader.readArrayOfDate(FieldKind[fieldKind]);
                break;
            case FieldKind.TIMESTAMP:
                fields[FieldKind[fieldKind]] = reader.readTimestamp(FieldKind[fieldKind]);
                break;
            case FieldKind.ARRAY_OF_TIMESTAMP:
                fields[FieldKind[fieldKind]] = reader.readArrayOfTimestamp(FieldKind[fieldKind]);
                break;
            case FieldKind.TIMESTAMP_WITH_TIMEZONE:
                fields[FieldKind[fieldKind]] = reader.readTimestampWithTimezone(FieldKind[fieldKind]);
                break;
            case FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE:
                fields[FieldKind[fieldKind]] = reader.readArrayOfTimestampWithTimezone(FieldKind[fieldKind]);
                break;
            case FieldKind.COMPACT:
                fields[FieldKind[fieldKind]] = reader.readCompact(FieldKind[fieldKind]);
                break;
            case FieldKind.ARRAY_OF_COMPACT:
                fields[FieldKind[fieldKind]] = reader.readArrayOfCompact(FieldKind[fieldKind]);
                break;
            case FieldKind.PORTABLE:
                throw new Error('Portable field is not supported in compact');
            case FieldKind.ARRAY_OF_PORTABLE:
                throw new Error('Portable field is not supported in compact');
            case FieldKind.NULLABLE_BOOLEAN:
                fields[FieldKind[fieldKind]] = reader.readNullableBoolean(FieldKind[fieldKind]);
                break;
            case FieldKind.ARRAY_OF_NULLABLE_BOOLEAN:
                fields[FieldKind[fieldKind]] = reader.readArrayOfNullableBoolean(FieldKind[fieldKind]);
                break;
            case FieldKind.NULLABLE_INT8:
                fields[FieldKind[fieldKind]] = reader.readNullableInt8(FieldKind[fieldKind]);
                break;
            case FieldKind.ARRAY_OF_NULLABLE_INT8:
                fields[FieldKind[fieldKind]] = reader.readArrayOfNullableInt8(FieldKind[fieldKind]);
                break;
            case FieldKind.NULLABLE_INT16:
                fields[FieldKind[fieldKind]] = reader.readNullableInt16(FieldKind[fieldKind]);
                break;
            case FieldKind.ARRAY_OF_NULLABLE_INT16:
                fields[FieldKind[fieldKind]] = reader.readArrayOfNullableInt16(FieldKind[fieldKind]);
                break;
            case FieldKind.NULLABLE_INT32:
                fields[FieldKind[fieldKind]] = reader.readNullableInt32(FieldKind[fieldKind]);
                break;
            case FieldKind.ARRAY_OF_NULLABLE_INT32:
                fields[FieldKind[fieldKind]] = reader.readArrayOfNullableInt32(FieldKind[fieldKind]);
                break;
            case FieldKind.NULLABLE_INT64:
                fields[FieldKind[fieldKind]] = reader.readNullableInt64(FieldKind[fieldKind]);
                break;
            case FieldKind.ARRAY_OF_NULLABLE_INT64:
                fields[FieldKind[fieldKind]] = reader.readArrayOfNullableInt64(FieldKind[fieldKind]);
                break;
            case FieldKind.NULLABLE_FLOAT32:
                fields[FieldKind[fieldKind]] = reader.readNullableFloat32(FieldKind[fieldKind]);
                break;
            case FieldKind.ARRAY_OF_NULLABLE_FLOAT32:
                fields[FieldKind[fieldKind]] = reader.readArrayOfNullableFloat32(FieldKind[fieldKind]);
                break;
            case FieldKind.NULLABLE_FLOAT64:
                fields[FieldKind[fieldKind]] = reader.readNullableFloat64(FieldKind[fieldKind]);
                break;
            case FieldKind.ARRAY_OF_NULLABLE_FLOAT64:
                fields[FieldKind[fieldKind]] = reader.readArrayOfNullableFloat64(FieldKind[fieldKind]);
                break;
            }
        }
        return new Flexible(fields);
    }

    write(writer, instance) {
        for (const fieldKind of this.fieldKinds) {
            const fieldName = FieldKind[fieldKind];
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
            case FieldKind.CHAR:
                throw new Error('Char field is not supported in compact');
            case FieldKind.ARRAY_OF_CHAR:
                throw new Error('Char field is not supported in compact');
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
            case FieldKind.PORTABLE:
                throw new Error('Portable field is not supported in compact');
            case FieldKind.ARRAY_OF_PORTABLE:
                throw new Error('Portable field is not supported in compact');
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

class NodeDTO {
    constructor(id, child) {
        this.id = id;
        this.child = child;
    }
}

class NodeDTOSerializer {
    constructor() {
        this.hzClassName = 'NodeDTO';
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
        this.hzClassName = 'MainDTO';
    }

    read(reader) {
        const b = reader.readInt8('b', 0);
        const bool = reader.readBoolean('bool', false);
        const s = reader.readInt16('s', 0);
        const i = reader.readInt32('i', 0);
        const l = reader.readInt64('l', 0);
        const f = reader.readFloat32('f', 0);
        const d = reader.readFloat64('d', 0);
        const str = reader.readString('str', '');
        const inner = reader.readCompact('inner', null);
        const bigDecimal = reader.readDecimal('bigDecimal', new BigDecimal(0n, 0));
        const localTime = reader.readTime('localTime', new LocalTime(0, 0, 0, 0));
        const localDate = reader.readDate('localDate', new LocalDate(0, 1, 1));
        const localDateTime = reader.readTimestamp('localDateTime',
            new LocalDateTime(new LocalDate(0, 1, 1), new LocalTime(0, 0, 0, 0)));
        const offsetDateTime = reader.readTimestampWithTimezone('offsetDateTime',
            new OffsetDateTime(new LocalDateTime(new LocalDate(0, 1, 1), new LocalTime(0, 0, 0, 0)), 0)
        );
        const nullableB = reader.readNullableInt8('nullableB', null);
        const nullableBool = reader.readNullableBoolean('nullableBool', null);
        const nullableS = reader.readNullableInt16('nullableS', null);
        const nullableI = reader.readNullableInt32('nullableI', null);
        const nullableL = reader.readNullableInt64('nullableL', null);
        const nullableF = reader.readNullableFloat32('nullableF', null);
        const nullableD = reader.readNullableFloat64('nullableD', null);

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
            strstr: Fields.arrayOfString,
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
        strstr: innerDTO.strstr,
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
            inner: Fields.genericRecord,
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

const referenceObjects = {
    [FieldKind[FieldKind.BOOLEAN]]: true,
    [FieldKind[FieldKind.ARRAY_OF_BOOLEAN]]: [true, false, true, true, true, false, true, true, false],
    [FieldKind[FieldKind.INT8]]: -32,
    [FieldKind[FieldKind.ARRAY_OF_INT8]]: Buffer.from([42, -128, -1, 127]),
    [FieldKind[FieldKind.INT16]]: -456,
    [FieldKind[FieldKind.ARRAY_OF_INT16]]: [-4231, 12343, 0],
    [FieldKind[FieldKind.INT32]]: 21212121,
    [FieldKind[FieldKind.ARRAY_OF_INT32]]: [-1, 1, 0, 9999999],
    [FieldKind[FieldKind.INT64]]: Long.fromNumber(123456789),
    [FieldKind[FieldKind.ARRAY_OF_INT64]]: [Long.fromNumber(11), Long.fromNumber(-123456789)],
    [FieldKind[FieldKind.FLOAT32]]: 12.5,
    [FieldKind[FieldKind.ARRAY_OF_FLOAT32]]: [
        -13.130000114440918,
        12345.669921875,
        0.10000000149011612,
        9876543,
        -99999.9921875,
    ],
    [FieldKind[FieldKind.FLOAT64]]: 12345678.90123,
    [FieldKind[FieldKind.ARRAY_OF_FLOAT64]]: [-12345.67],
    [FieldKind[FieldKind.STRING]]: 'üğişçöa',
    [FieldKind[FieldKind.ARRAY_OF_STRING]]: ['17', '😊 😇 🙂', 'abc'],
    [FieldKind[FieldKind.DECIMAL]]: BigDecimal.fromString('123.456'),
    [FieldKind[FieldKind.ARRAY_OF_DECIMAL]]: [BigDecimal.fromString('0'), BigDecimal.fromString('-123456.789')],
    [FieldKind[FieldKind.TIME]]: new LocalTime(2, 3, 4, 5),
    [FieldKind[FieldKind.ARRAY_OF_TIME]]: [new LocalTime(8, 7, 6, 5)],
    [FieldKind[FieldKind.DATE]]: new LocalDate(2022, 1, 1),
    [FieldKind[FieldKind.ARRAY_OF_DATE]]: [new LocalDate(2021, 11, 11), new LocalDate(2020, 3, 3)],
    [FieldKind[FieldKind.TIMESTAMP]]: LocalDateTime.from(2022, 2, 2, 3, 3, 3, 4000),
    [FieldKind[FieldKind.ARRAY_OF_TIMESTAMP]]: [LocalDateTime.from(1990, 2, 12, 13, 14, 54, 98765000)],
    [FieldKind[FieldKind.TIMESTAMP_WITH_TIMEZONE]]: OffsetDateTime.from(200, 10, 10, 16, 44, 42, 12345000, 7200),
    [FieldKind[FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE]]: [OffsetDateTime.from(2001, 1, 10, 12, 24, 2, 45, -7200)],
    [FieldKind[FieldKind.COMPACT]]: new Employee(42, Long.fromString('42')),
    [FieldKind[FieldKind.ARRAY_OF_COMPACT]]: [new Employee(42, Long.fromString('42')), new Employee(123, Long.fromString('123'))],
    [FieldKind[FieldKind.NULLABLE_BOOLEAN]]: false,
    [FieldKind[FieldKind.ARRAY_OF_NULLABLE_BOOLEAN]]: [false, false, true],
    [FieldKind[FieldKind.NULLABLE_INT8]]: -34,
    [FieldKind[FieldKind.ARRAY_OF_NULLABLE_INT8]]: [-32, 32],
    [FieldKind[FieldKind.NULLABLE_INT16]]: 36,
    [FieldKind[FieldKind.ARRAY_OF_NULLABLE_INT16]]: [37, -37, 0, 12345],
    [FieldKind[FieldKind.NULLABLE_INT32]]: -38,
    [FieldKind[FieldKind.ARRAY_OF_NULLABLE_INT32]]: [-39, 2134567, -8765432, 39],
    [FieldKind[FieldKind.NULLABLE_INT64]]: Long.fromNumber(-4040),
    [FieldKind[FieldKind.ARRAY_OF_NULLABLE_INT64]]: [1, 41, -1, 12312312312, -9312912391].map(x => Long.fromNumber(x)),
    [FieldKind[FieldKind.NULLABLE_FLOAT32]]: 42.400001525878906,
    [FieldKind[FieldKind.ARRAY_OF_NULLABLE_FLOAT32]]: [
        -43.400001525878906,
        434.42999267578125
    ],
    [FieldKind[FieldKind.NULLABLE_FLOAT64]]: 44.12,
    [FieldKind[FieldKind.ARRAY_OF_NULLABLE_FLOAT64]]: [45.678, -4567.8, 0.12345],
};

module.exports = {
    serialize,
    createCompactGenericRecord,
    mimicSchemaReplication,
    createSerializationService,
    createMainDTO,
    referenceObjects,
    varSizeFields,
    fixedSizeFields,
    NodeDTOSerializer,
    NamedDTOSerializer,
    InnerDTOSerializer,
    MainDTOSerializer,
    MainDTOSerializerWithDefaults,
    Flexible,
    FlexibleSerializer,
    supportedFieldKinds,
    NodeDTO,
    Bits,
    BitsSerializer,
    Employee,
    EmployeeSerializer,
    EmployeeDTO,
    EmployeeDTOSerializer,
    Employer,
    EmployerSerializer,
    HIRING_STATUS
};
