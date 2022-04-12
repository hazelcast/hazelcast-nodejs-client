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
/** @ignore *//** */

import {CompactSerializer} from './CompactSerializer';
import {Schema} from './Schema';
import {DefaultCompactReader} from './DefaultCompactReader';
import {SchemaService} from './SchemaService';
import {DefaultCompactWriter} from './DefaultCompactWriter';
import {FieldOperations} from '../generic_record/FieldOperations';
import {SchemaNotFoundError, SchemaNotReplicatedError} from '../../core';
import {ObjectDataInput, ObjectDataOutput, PositionalObjectDataOutput} from '../ObjectData';
import {CompactGenericRecordImpl} from '../generic_record/CompactGenericRecord';
import {SchemaWriter} from './SchemaWriter';
/**
 * Serializer for compact serializable objects.
 *
 * This serializer is used for compact serializable objects that are registered using serialization config
 * and Compact generic records ({@link CompactGenericRecordImpl}).
 *
 * @internal
 */
export class CompactStreamSerializer {

    id = -55;
    /**
     * Users' serializer config for classes are stored here. Used to determine if a class is compact serializable.
     * Also used to get serializer of an object while serializing.
     */
    private readonly classToSerializerMap: Map<Function, CompactSerializer<any>>;
    /**
     * Used to cache created schema of an object after initial serialization. If an object has schema,
     * no need to create schema again and put to schema service.
     */
    private readonly classToSchemaMap : Map<Function, Schema>;
    /**
     * A table from typeName to serializer map. Serialized compact data include a type name. Deserializer of compact data is
     * determined using this table.
     */
    private readonly typeNameToSerializersMap: Map<string, CompactSerializer<any>>;

    constructor(
        private readonly schemaService: SchemaService
    ) {
        this.classToSerializerMap = new Map<Function, CompactSerializer<any>>();
        this.classToSchemaMap = new Map<Function, Schema>();
        this.typeNameToSerializersMap = new Map<string, CompactSerializer<any>>();
    }

    getOrReadSchema(input: ObjectDataInput): Schema {
        const schemaId = input.readLong();
        const schema = this.schemaService.get(schemaId);
        if (schema !== undefined) {
            return schema;
        }

        throw new SchemaNotFoundError(`The schema can not be found with id ${schemaId}`, schemaId);
    }

    registerSchemaToClass(schema: Schema, clazz: Function): void {
        this.classToSchemaMap.set(clazz, schema);
    }

    read(input: ObjectDataInput): any {
        const schema = this.getOrReadSchema(input);
        const serializer = this.typeNameToSerializersMap.get(schema.typeName);

        if (serializer === undefined) {
            // Registration does not exist, we will return a GenericRecord
            return new DefaultCompactReader(this, input, schema).toDeserialized();
        }

        const reader = new DefaultCompactReader(this, input, schema);
        return serializer.read(reader);
    }

    write(output: ObjectDataOutput, object: any): void {
        if (object instanceof CompactGenericRecordImpl) {
            this.writeGenericRecord(output as PositionalObjectDataOutput, object);
        } else {
            this.writeObject(output as PositionalObjectDataOutput, object);
        }
    }

    /**
     * Used by serialization service to check if an object is compact serializable
     * @param clazz A class
     */
    isRegisteredAsCompact(clazz: Function) : boolean {
        return this.classToSerializerMap.has(clazz);
    }

    registerSerializer(serializer: CompactSerializer<any>) {
        this.classToSerializerMap.set(serializer.getClass(), serializer);
        this.typeNameToSerializersMap.set(serializer.getTypeName(), serializer);
    }

    writeSchema(output: PositionalObjectDataOutput, schema: Schema) {
        output.writeLong(schema.schemaId);
    }

    writeGenericRecord(output: PositionalObjectDataOutput, record: CompactGenericRecordImpl) : void {
        const schema: Schema = record.getSchema();
        this.throwIfSchemaNotReplicatedToCluster(schema, undefined);
        this.writeSchema(output, schema);
        const writer = new DefaultCompactWriter(this, output, schema);
        for (const field of schema.getFields()) {
            FieldOperations.fieldOperations(field.kind).writeFieldFromRecordToWriter(writer, record, field.fieldName);
        }
        writer.end();
    }

    writeSchemaAndObject(
        compactSerializer: CompactSerializer<any>,
        output: PositionalObjectDataOutput,
        schema: Schema,
        o: any
    ) : void {
        this.writeSchema(output, schema);
        const writer = new DefaultCompactWriter(this, output, schema);
        compactSerializer.write(writer, o);
        writer.end();
    }

    writeObject(output: PositionalObjectDataOutput, obj: any) : void {
        const compactSerializer = this.classToSerializerMap.get(obj.constructor);
        const clazz = compactSerializer.getClass();
        let schema = this.classToSchemaMap.get(clazz);
        if (schema === undefined) {
            const writer = new SchemaWriter(compactSerializer.getTypeName());
            compactSerializer.write(writer, obj);
            schema = writer.build();
            this.throwIfSchemaNotReplicatedToCluster(schema, clazz);
        }
        this.writeSchemaAndObject(compactSerializer, output, schema, obj);
    }

    private throwIfSchemaNotReplicatedToCluster(schema: Schema, clazz: Function | undefined): void {
        // We guarantee that if Schema is not in the schemaService, it is not replicated to the cluster.
        if (this.schemaService.get(schema.schemaId) === undefined) {
            throw new SchemaNotReplicatedError(`The schema ${schema.schemaId} is not replicated yet.`, schema, clazz);
        }
    }
}
