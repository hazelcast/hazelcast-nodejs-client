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

import {CompactSerializer} from './CompactSerializer';
import {Schema} from './Schema';
import {DefaultCompactReader} from './DefaultCompactReader';
import {SchemaService} from './SchemaService';
import {DefaultCompactWriter} from './DefaultCompactWriter';
import {FieldOperations} from '../generic_record/FieldOperations';
import {HazelcastSerializationError, SchemaNotFoundError, SchemaNotReplicatedError} from '../../core';
import {ObjectDataInput, ObjectDataOutput, PositionalObjectDataOutput} from '../ObjectData';
import {IS_GENERIC_RECORD_SYMBOL} from '../generic_record/GenericRecord';
import {CompactGenericRecord} from '../generic_record/CompactGenericRecord';
import {SchemaWriter} from './SchemaWriter';

/**
 * @internal
 */
export class CompactStreamSerializer {

    private readonly classNameToSerializersMap : Map<string, CompactSerializer<new () => any>>;
    private readonly classNameToSchemaMap : Map<string, Schema>;
    private readonly typeNameToSerializersMap: Map<string, CompactSerializer<new () => any>>;

    constructor(
        private readonly schemaService: SchemaService
    ) {
        this.classNameToSerializersMap = new Map<string, CompactSerializer<new () => any>>();
        this.classNameToSchemaMap = new Map<string, Schema>();
        this.typeNameToSerializersMap = new Map<string, CompactSerializer<new () => any>>();
    }

    getOrReadSchema(input: ObjectDataInput, schemaIncludedInBinary: boolean): Schema {
        const schemaId = input.readLong();
        let schema = this.schemaService.get(schemaId);
        if (schema !== null) {
            if (schemaIncludedInBinary) {
                const sizeOfSchema = input.readInt();
                input.skipBytes(sizeOfSchema);
            }
            return schema;
        }

        if (schemaIncludedInBinary) {
            // sizeOfSchema
            input.readInt();
            schema = input.readObject();
            const incomingSchemaId = schema.schemaId;
            if (schemaId !== incomingSchemaId) {
                throw new HazelcastSerializationError(
                    `Invalid schema id found. Expected ${schemaId}, actual ${incomingSchemaId} for schema ${schema}`
                );
            }
            this.schemaService.putLocal(schema);
            return schema;
        }

        throw new SchemaNotFoundError(`The schema can not be found with id ${schemaId}`, schemaId);
    }

    read(input: ObjectDataInput, schemaIncludedInBinary: boolean): any {
        const schema = this.getOrReadSchema(input, schemaIncludedInBinary);
        const registration = this.typeNameToSerializersMap.get(schema.typeName);

        if (registration === undefined) {
            // Registration does not exist, we will return a GenericRecord
            return new DefaultCompactReader(this, input, schema, null, schemaIncludedInBinary).toSerialized();
        }

        const genericRecord = new DefaultCompactReader(
            this, input, schema, registration.hzTypeName || registration.hzClassName, schemaIncludedInBinary
        );
        return registration.read(genericRecord);
    }

    write(output: ObjectDataOutput, object: any, schemaIncludedInBinary: boolean): void {
        if (!(output instanceof PositionalObjectDataOutput)) {
            throw new HazelcastSerializationError('Expected a positional object data output.')
        }
        if (object && object[IS_GENERIC_RECORD_SYMBOL] === true) {
            this.writeGenericRecord(output, object, schemaIncludedInBinary);
        } else {
            this.writeObject(output, object, schemaIncludedInBinary);
        }
    }

    isRegisteredAsCompact(className: string) : boolean {
        return this.classNameToSerializersMap.has(className);
    }

    registerSerializer(serializer: CompactSerializer<new () => any>) {
        this.classNameToSerializersMap.set(serializer.hzClassName, serializer);
        if (serializer.hzTypeName) {
            this.typeNameToSerializersMap.set(serializer.hzTypeName, serializer);
        } else {
            this.typeNameToSerializersMap.set(serializer.hzClassName, serializer);
        }
    }

    putToSchemaService(includeSchemaOnBinary: boolean, schema: Schema): void {
        this.schemaService.putLocal(schema);
    }

    writeSchema(output: PositionalObjectDataOutput, includeSchemaOnBinary: boolean, schema: Schema) {
        output.writeLong(schema.schemaId);
        if (includeSchemaOnBinary) {
            const sizeOfSchemaPosition = output.position();
            output.writeInt(0);
            const schemaBeginPos = output.position();
            output.writeObject(schema);
            const schemaEndPosition = output.position();
            output.pwriteInt(sizeOfSchemaPosition, schemaEndPosition - schemaBeginPos);
        }
    }

    writeGenericRecord(
        output: PositionalObjectDataOutput, record: CompactGenericRecord, includeSchemaOnBinary: boolean
    ) : void {
        const schema: Schema = record.getSchema();
        this.throwIfSchemaNotReplicatedToCluster(schema);
        this.putToSchemaService(includeSchemaOnBinary, schema)
        this.writeSchema(output, includeSchemaOnBinary, schema);
        const writer = new DefaultCompactWriter(this, output, schema, includeSchemaOnBinary);
        const fields = [...schema.getFields()];
        for (let i = 0; i < fields.length; i++) {
            const fieldName = fields[i].fieldName;
            const fieldKind = fields[i].kind;
            FieldOperations.fieldOperations(fieldKind).writeFieldFromRecordToWriter(writer, record, fieldName);
        }
        writer.end();
    }

    writeSchemaAndObject(
        compactSerializer: CompactSerializer<new () => any>,
        output: PositionalObjectDataOutput,
        includeSchemaOnBinary: boolean,
        schema: Schema,
        o: any
    ) : void {
        this.writeSchema(output, includeSchemaOnBinary, schema);
        const writer = new DefaultCompactWriter(this, output, schema, includeSchemaOnBinary);
        compactSerializer.write(writer, o);
        writer.end();
    }

    writeObject(output: PositionalObjectDataOutput, o: any, includeSchemaOnBinary: boolean) : void {
        const compactSerializer = this.getSerializerFromObject(o);
        const className = compactSerializer.hzClassName;
        let schema = this.classNameToSchemaMap.get(className);
        if (schema === undefined) {
            const writer = new SchemaWriter(compactSerializer.hzTypeName || className);
            compactSerializer.write(writer, o);
            schema = writer.build();
            this.classNameToSchemaMap.set(className, schema);
            this.throwIfSchemaNotReplicatedToCluster(schema);
            this.putToSchemaService(includeSchemaOnBinary, schema);
        }
        this.writeSchemaAndObject(compactSerializer, output, includeSchemaOnBinary, schema, o);
    }

    private throwIfSchemaNotReplicatedToCluster(schema: Schema): void {
        // We guarantee that if Schema is not in the schemaService, it is not replicated to the cluster.
        if (this.schemaService.get(schema.schemaId) === null) {
            throw new SchemaNotReplicatedError(`The schema ${schema.schemaId} is not replicated yet.`, schema);
        }
    }

    private getSerializerFromObject(obj: any) : CompactSerializer<new () => any> {
        const serializer = this.classNameToSerializersMap.get(obj.constructor.name);

        if (serializer !== undefined) {
            return serializer;
        }
        throw new HazelcastSerializationError(`Explicit compact serializer is needed for obj: ${obj}`);
    }
}