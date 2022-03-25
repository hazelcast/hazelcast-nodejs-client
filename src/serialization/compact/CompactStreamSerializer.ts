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
/** @ignore *//** */

import {Class, CompactSerializer} from './CompactSerializer';
import {Schema} from './Schema';
import {DefaultCompactReader} from './DefaultCompactReader';
import {SchemaService} from './SchemaService';
import {DefaultCompactWriter} from './DefaultCompactWriter';
import {FieldOperations} from '../generic_record/FieldOperations';
import {HazelcastSerializationError, SchemaNotFoundError, SchemaNotReplicatedError} from '../../core';
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
    private readonly classToSerializerMap: Map<Class, CompactSerializer<Class>> = new Map();
    /**
     * Used to cache created schema of an object after initial serialization. If an object has schema,
     * no need to create schema again and put to schema service.
     */
    private readonly classToSchemaMap : Map<Class, Schema>;
    /**
     * A table from typeName to serializer map. Serialized compact data include a type name. Deserializer of compact data is
     * determined using this table.
     */
    private readonly typeNameToSerializersMap: Map<string, CompactSerializer<Class>>;

    constructor(
        private readonly schemaService: SchemaService
    ) {
        this.classToSchemaMap = new Map<Class, Schema>();
        this.typeNameToSerializersMap = new Map<string, CompactSerializer<Class>>();
    }

    getOrReadSchema(input: ObjectDataInput): Schema {
        const schemaId = input.readLong();
        const schema = this.schemaService.get(schemaId);
        if (schema !== null) {
            return schema;
        }

        throw new SchemaNotFoundError(`The schema can not be found with id ${schemaId}`, schemaId);
    }

    registerSchemaToClass(schema: Schema, clazz: Class): void {
        this.classToSchemaMap.set(clazz, schema);
    }

    read(input: ObjectDataInput): any {
        const schema = this.getOrReadSchema(input);
        const serializer = this.typeNameToSerializersMap.get(schema.typeName);

        if (serializer === undefined) {
            // Registration does not exist, we will return a GenericRecord
            return new DefaultCompactReader(this, input, schema, null).toSerialized();
        }

        const reader = new DefaultCompactReader(this, input, schema, serializer.typeName);
        return serializer.read(reader);
    }

    write(output: ObjectDataOutput, object: any, throwIfSchemaNotReplicated = true): void {
        if (object instanceof CompactGenericRecordImpl) {
            this.writeGenericRecord(output as PositionalObjectDataOutput, object, throwIfSchemaNotReplicated);
        } else {
            this.writeObject(output as PositionalObjectDataOutput, object, throwIfSchemaNotReplicated);
        }
    }

    /**
     * Used by serialization service to check if an object is compact serializable
     * @param clazz A class
     */
    isRegisteredAsCompact(clazz: new() => any) : boolean {
        return this.classToSerializerMap.has(clazz);
    }

    registerSerializer(serializer: CompactSerializer<Class>) {
        this.classToSerializerMap.set(serializer.class, serializer);
        this.typeNameToSerializersMap.set(serializer.typeName, serializer);
    }

    writeSchema(output: PositionalObjectDataOutput, schema: Schema) {
        output.writeLong(schema.schemaId);
    }

    writeGenericRecord(
        output: PositionalObjectDataOutput, record: CompactGenericRecordImpl, throwIfSchemaNotReplicated = true
    ) : void {
        const schema: Schema = record.getSchema();
        if (throwIfSchemaNotReplicated) {
            this.throwIfSchemaNotReplicatedToCluster(schema, undefined);
        }
        this.writeSchema(output, schema);
        const writer = new DefaultCompactWriter(this, output, schema);
        for (const field of schema.getFields()) {
            FieldOperations.fieldOperations(field.kind).writeFieldFromRecordToWriter(
                writer, record, field.fieldName, throwIfSchemaNotReplicated
            );
        }
        writer.end();
    }

    writeSchemaAndObject(
        compactSerializer: CompactSerializer<Class>,
        output: PositionalObjectDataOutput,
        schema: Schema,
        o: any
    ) : void {
        this.writeSchema(output, schema);
        const writer = new DefaultCompactWriter(this, output, schema);
        compactSerializer.write(writer, o);
        writer.end();
    }

    writeObject(output: PositionalObjectDataOutput, o: any, throwIfSchemaNotReplicated = true) : void {
        const compactSerializer = this.getSerializerFromObject(o);
        const clazz = compactSerializer.class;
        let schema = this.classToSchemaMap.get(clazz);
        if (schema === undefined) {
            const writer = new SchemaWriter(compactSerializer.typeName);
            compactSerializer.write(writer, o);
            schema = writer.build();
            if (throwIfSchemaNotReplicated) {
                this.throwIfSchemaNotReplicatedToCluster(schema, clazz);
            }
        }
        this.writeSchemaAndObject(compactSerializer, output, schema, o);
    }

    private throwIfSchemaNotReplicatedToCluster(schema: Schema, clazz: Class | undefined): void {
        // We guarantee that if Schema is not in the schemaService, it is not replicated to the cluster.
        if (this.schemaService.get(schema.schemaId) === null) {
            throw new SchemaNotReplicatedError(`The schema ${schema.schemaId} is not replicated yet.`, schema, clazz);
        }
    }

    private getSerializerFromObject(obj: any) : CompactSerializer<Class> {
        const serializer = this.classToSerializerMap.get(obj.constructor);

        if (serializer !== undefined) {
            return serializer;
        }
        // This is an unreachable line. It is ok for this line to be not covered in tests.
        throw new HazelcastSerializationError(`Explicit compact serializer is needed for obj: ${obj}`);
    }
}
