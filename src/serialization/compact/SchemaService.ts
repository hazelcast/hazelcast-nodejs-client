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

import * as Long from 'long';
import {Schema} from './Schema';
import {ILogger} from '../../logging';
import {Invocation, InvocationService} from '../../invocation/InvocationService';
import {ClientSendAllSchemasCodec} from '../../codec/ClientSendAllSchemasCodec';
import {ClientFetchSchemaCodec} from '../../codec/ClientFetchSchemaCodec';
import {ClientSendSchemaCodec} from '../../codec/ClientSendSchemaCodec';
import { HazelcastSerializationError, IllegalStateError } from '../../core';
import { delayedPromise } from '../../util/Util';
import { ClientConfig } from '../../config';
import { ClusterService } from '../../invocation/ClusterService';

const INVOCATION_RETRY_PAUSE_MILLIS = 'hazelcast.client.invocation.retry.pause.millis';
const MAX_PUT_RETRY_COUNT = 'hazelcast.client.schema.max.put.retry.count';

/**
 * Service to put and get metadata to cluster.
 * @internal
 */
export class SchemaService {

    private readonly retryPauseMillis: number;
    private readonly maxPutRetryCount: number;
    schemas: Map<string, Schema>;

    constructor(
        clientConfig: ClientConfig,
        // a getter is used because there is a cyclic dependency between ClusterService and SchemaService
        private readonly getClusterService: () => ClusterService,
        // a getter is used because there is a cyclic dependency between InvocationService and SchemaService
        private readonly getInvocationService: () => InvocationService,
        private readonly logger: ILogger
    ) {
        this.schemas = new Map<string, Schema>();
        this.retryPauseMillis = clientConfig.properties[INVOCATION_RETRY_PAUSE_MILLIS] as number;
        this.maxPutRetryCount = clientConfig.properties[MAX_PUT_RETRY_COUNT] as number;
    }

    /**
     * Fetches the schema with id {@link schemaId} from cluster to local registry of the schema service.
     */
    fetchSchema(schemaId: Long): Promise<void> {
        const invocation = new Invocation(this.getInvocationService(), ClientFetchSchemaCodec.encodeRequest(schemaId));
        invocation.handler = ClientFetchSchemaCodec.decodeResponse;
        return this.getInvocationService().invoke(invocation).then(schema => {
            if (schema !== null) {
                this.putIfAbsent(schema);
                this.logger.trace('SchemaService', `Found schema id ${schemaId} on the cluster`);
            } else {
                this.logger.trace('SchemaService', `Did not find schema id ${schemaId} on the cluster`);
                throw new HazelcastSerializationError(`The schema can not be found with id ${schemaId}`);
            }
        });
    }

    /**
     * Returns the schema with id {@link schemaId} in schema service's local registry,
     * returning `undefined` if it is not found.
     */
    get(schemaId: Long): Schema | undefined {
        return this.schemas.get(schemaId.toString());
    }

    /**
     * Puts the schema with the given id to the cluster.
     */
    put(schema: Schema): Promise<void> {
        const schemaId = schema.schemaId;
        const existingSchema = this.schemas.get(schemaId.toString());
        if (existingSchema !== undefined) {
            this.logger.trace('SchemaService', `Schema id ${schemaId} already exists locally`);
            return Promise.resolve();
        }

        if (this.replicateSchemaInCluster(schema)) {
            throw new IllegalStateError(
                `The schema ${schema} cannot be replicated in the cluster, after ${this.maxPutRetryCount}  retries. 
                It might be the case that the client is connected to the two halves of the cluster that 
                is experiencing a split-brain, and continue putting the data associated with that schema might 
                result in data loss. It might be possible to replicate the schema after some time, when the cluster is healed.`
            );
        }

        this.putIfAbsent(schema);
    }

    private putIfAbsent(schema: Schema): void {
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

    sendAllSchemas(): Promise<void> {
        if (this.schemas.size === 0) {
            this.logger.trace('SchemaService', 'There is no schemas to send to the cluster');
            return Promise.resolve();
        }
        this.logger.trace('SchemaService', `Sending ${this.schemas.size} schemas to the cluster ${this.schemas}`);
        const message = ClientSendAllSchemasCodec.encodeRequest([...this.schemas.values()]);
        const invocation = new Invocation(this.getInvocationService(), message);
        return this.getInvocationService().invokeUrgent(invocation).then(() => {});
    }

    async replicateSchemaInCluster(schema: Schema): Promise<boolean> {
        let clientMessage = ClientSendSchemaCodec.encodeRequest(schema);
        outer:
        for (let index = 0; index < this.maxPutRetryCount; index++) {
            const invocation = new Invocation(this.getInvocationService(), clientMessage);
            const response = await this.getInvocationService().invoke(invocation);
            const replicatedMemberUuids = ClientSendSchemaCodec.decodeResponse(response);
            const members = this.getClusterService().getMembers();
            for (const member of members) {
                if (!replicatedMemberUuids.has(member.uuid)) {
                    // There is a member in our member list that the schema
                    // is not known to be replicated yet. We should retry
                    // sending it in a random member.

                    await delayedPromise(this.retryPauseMillis);

                    // correlation id will be set when the invoke method is
                    // called above
                    clientMessage = clientMessage.copyMessageWithSharedNonInitialFrames();

                    continue outer;

                }
            }

            // All members in our member list all known to have the schema
            return Promise.resolve(true);
        }

        // We tried to send it a couple of times, but the member list in our
        // local and the member list returned by the initiator nodes did not
        // match.
        return Promise.resolve(false);
    }
}
