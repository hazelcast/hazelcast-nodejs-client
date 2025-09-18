"use strict";
/* eslint-disable @typescript-eslint/ban-types */
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
exports.CompactStreamSerializer = void 0;
const DefaultCompactReader_1 = require("./DefaultCompactReader");
const DefaultCompactWriter_1 = require("./DefaultCompactWriter");
const FieldOperations_1 = require("../generic_record/FieldOperations");
const core_1 = require("../../core");
const CompactGenericRecord_1 = require("../generic_record/CompactGenericRecord");
const SchemaWriter_1 = require("./SchemaWriter");
/**
 * Serializer for compact serializable objects.
 *
 * This serializer is used for compact serializable objects that are registered using serialization config
 * and Compact generic records ({@link CompactGenericRecordImpl}).
 *
 * @internal
 */
class CompactStreamSerializer {
    constructor(schemaService) {
        this.schemaService = schemaService;
        this.id = -55;
        this.classToSerializerMap = new Map();
        this.classToSchemaMap = new Map();
        this.typeNameToSerializersMap = new Map();
    }
    getOrReadSchema(input) {
        const schemaId = input.readLong();
        const schema = this.schemaService.get(schemaId);
        if (schema !== undefined) {
            return schema;
        }
        throw new core_1.SchemaNotFoundError(`The schema can not be found with id ${schemaId}`, schemaId);
    }
    registerSchemaToClass(schema, clazz) {
        this.classToSchemaMap.set(clazz, schema);
    }
    read(input) {
        const schema = this.getOrReadSchema(input);
        const serializer = this.typeNameToSerializersMap.get(schema.typeName);
        if (serializer === undefined) {
            // Registration does not exist, we will return a GenericRecord
            return new DefaultCompactReader_1.DefaultCompactReader(this, input, schema).toDeserialized();
        }
        const reader = new DefaultCompactReader_1.DefaultCompactReader(this, input, schema);
        return serializer.read(reader);
    }
    write(output, object) {
        if (object instanceof CompactGenericRecord_1.CompactGenericRecordImpl) {
            this.writeGenericRecord(output, object);
        }
        else {
            this.writeObject(output, object);
        }
    }
    /**
     * Used by serialization service to check if an object is compact serializable
     * @param clazz A class
     */
    isRegisteredAsCompact(clazz) {
        return this.classToSerializerMap.has(clazz);
    }
    registerSerializer(serializer) {
        this.classToSerializerMap.set(serializer.getClass(), serializer);
        this.typeNameToSerializersMap.set(serializer.getTypeName(), serializer);
    }
    writeSchema(output, schema) {
        output.writeLong(schema.schemaId);
    }
    writeGenericRecord(output, record) {
        const schema = record.getSchema();
        this.throwIfSchemaNotReplicatedToCluster(schema, undefined);
        this.writeSchema(output, schema);
        const writer = new DefaultCompactWriter_1.DefaultCompactWriter(this, output, schema);
        for (const field of schema.getFields()) {
            FieldOperations_1.FieldOperations.fieldOperations(field.kind).writeFieldFromRecordToWriter(writer, record, field.fieldName);
        }
        writer.end();
    }
    writeSchemaAndObject(compactSerializer, output, schema, o) {
        this.writeSchema(output, schema);
        const writer = new DefaultCompactWriter_1.DefaultCompactWriter(this, output, schema);
        compactSerializer.write(writer, o);
        writer.end();
    }
    writeObject(output, obj) {
        const compactSerializer = this.classToSerializerMap.get(obj.constructor);
        if (compactSerializer == undefined) {
            throw new core_1.HazelcastSerializationError(`No serializer is registered for class/constructor ${obj.constructor.name}.`);
        }
        const clazz = compactSerializer.getClass();
        let schema = this.classToSchemaMap.get(clazz);
        if (schema === undefined) {
            const writer = new SchemaWriter_1.SchemaWriter(compactSerializer.getTypeName());
            compactSerializer.write(writer, obj);
            schema = writer.build();
            this.throwIfSchemaNotReplicatedToCluster(schema, clazz);
        }
        this.writeSchemaAndObject(compactSerializer, output, schema, obj);
    }
    throwIfSchemaNotReplicatedToCluster(schema, clazz) {
        // We guarantee that if Schema is not in the schemaService, it is not replicated to the cluster.
        if (this.schemaService.get(schema.schemaId) === undefined) {
            throw new core_1.SchemaNotReplicatedError(`The schema ${schema.schemaId} is not replicated yet.`, schema, clazz);
        }
    }
}
exports.CompactStreamSerializer = CompactStreamSerializer;
//# sourceMappingURL=CompactStreamSerializer.js.map