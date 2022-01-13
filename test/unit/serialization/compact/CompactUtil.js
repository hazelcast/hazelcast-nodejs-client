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

const { IllegalStateError } = require('../../../../lib');
const { SerializationConfigImpl } = require('../../../../src');
const { SerializationServiceV1 } = require('../../../../lib/serialization/SerializationService');

class InMemorySchemaService {
    constructor() {
        this.schemas = {};
    }

    get(schemaId) {
        return Promise.resolve(this.schemas[schemaId]);
    }

    put(schema) {
        const schemaId = schema.schemaId;
        const existingSchema = this.schemas[schemaId];
        if (existingSchema === undefined) {
            this.schemas[schemaId] = schema;
        }

        if (existingSchema !== undefined && !schema.equals(existingSchema)) {
            return Promise.reject(new IllegalStateError(`Schema with id ${schemaId} already exists.`));
        }
        return Promise.resolve();
    }

    putLocal(schema) {
        const schemaId = schema.schemaId;
        const existingSchema = this.schemas[schemaId];
        if (existingSchema === undefined) {
            this.schemas[schemaId] = schema;
        }

        if (existingSchema !== undefined && !schema.equals(existingSchema)) {
            throw new IllegalStateError(`Schema with id ${schemaId} already exists.`);
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
        return new Employee(age, rank, id, isHired, isFired);
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

module.exports = {
    createSerializationService,
    Bits,
    BitsSerializer,
    Employee,
    EmployeeSerializer,
    Employer,
    EmployerSerializer,
    HIRING_STATUS
};
