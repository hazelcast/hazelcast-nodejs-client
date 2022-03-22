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

import * as Long from 'long';
import {Schema} from './Schema';
import {ILogger} from '../../logging';
import {Invocation, InvocationService} from '../../invocation/InvocationService';
import {ClientSendAllSchemasCodec} from '../../codec/ClientSendAllSchemasCodec';
import {ClientFetchSchemaCodec} from '../../codec/ClientFetchSchemaCodec';
import {ClientSendSchemaCodec} from '../../codec/ClientSendSchemaCodec';
import { IllegalStateError } from '../../core';

/**
 * Service to put and get metadata to cluster.
 * @internal
 */
export interface ISchemaService {
    /**
     * Returns the schema with id {@link schemaId} in schema service's local registry,
     * returning null if it is not found.
     */
    get(schemaId: Long): Schema | null;


    /**
     * Fetches the schema with id {@link schemaId} from cluster to local registry of the schema service.
     */
    fetchSchema(schemaId: Long): Promise<void>;

    /**
     * Puts the schema with the given id to the cluster.
     */
    put(schema: Schema): Promise<void>;
}

/**
 * @internal
 */
export class SchemaService implements ISchemaService {
    schemas: Map<string, Schema>;

    constructor(
        // a getter is used because there is a cyclic dependency between InvocationService and SchemaService
        private readonly getInvocationService: () => InvocationService,
        private readonly logger: ILogger
    ) {
        this.schemas = new Map<string, Schema>();
    }

    fetchSchema(schemaId: Long): Promise<void> {
        const invocation = new Invocation(this.getInvocationService(), ClientFetchSchemaCodec.encodeRequest(schemaId));
        return this.getInvocationService().invoke(invocation).then(message => {
            const schema = ClientFetchSchemaCodec.decodeResponse(message);
            if (schema !== null) {
                this.putIfAbsent(schema);
                this.logger.trace('SchemaService', `Found schema id ${schemaId} on the cluster`);
            } else {
                this.logger.trace('SchemaService', `Did not find schema id ${schemaId} on the cluster`);
            }
        });
    }

    get(schemaId: Long): Schema | null {
        const schema = this.schemas.get(schemaId.toString());
        if (schema !== undefined) {
            return schema;
        } else {
            return null;
        }
    }


    put(schema: Schema): Promise<void> {
        const schemaId = schema.schemaId;
        const existingSchema = this.schemas.get(schemaId.toString());
        if (existingSchema !== undefined) {
            this.logger.trace('SchemaService', `Schema id ${schemaId} already exists locally`);
            return Promise.resolve();
        }
        const message = ClientSendSchemaCodec.encodeRequest(schema);
        const invocation = new Invocation(this.getInvocationService(), message);
        return this.getInvocationService().invoke(invocation).then(() => {
            this.putIfAbsent(schema);
        });
    }

    private putIfAbsent(schema: Schema) : void {
        const schemaId = schema.schemaId;
        const existingSchema = this.schemas.get(schemaId.toString());
        if (existingSchema === undefined) {
            this.logger.trace('SchemaService', `Added schema with id ${schemaId} locally`);
            this.schemas.set(schemaId.toString(), schema);
            return;
        }
        if (!existingSchema.equals(schema)) {
            throw new IllegalStateError(
                `Schema with schemaId ${schemaId} already exists. existing schema: ${existingSchema} new schema: ${schema}`
            );
        }
    }

    sendAllSchemas() : Promise<void> {
        if (this.schemas.size === 0) {
            this.logger.trace('SchemaService', 'There is no schemas to send to the cluster');
            return Promise.resolve();
        }
        this.logger.trace('SchemaService', `Sending ${this.schemas.size} schemas to the cluster ${this.schemas}`);
        const message = ClientSendAllSchemasCodec.encodeRequest([...this.schemas.values()]);
        const invocation = new Invocation(this.getInvocationService(), message);
        return this.getInvocationService().invokeUrgent(invocation).then(() => {});
    }
}
