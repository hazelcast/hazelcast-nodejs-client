"use strict";
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
exports.SchemaService = void 0;
const InvocationService_1 = require("../../invocation/InvocationService");
const ClientSendAllSchemasCodec_1 = require("../../codec/ClientSendAllSchemasCodec");
const ClientFetchSchemaCodec_1 = require("../../codec/ClientFetchSchemaCodec");
const ClientSendSchemaCodec_1 = require("../../codec/ClientSendSchemaCodec");
const core_1 = require("../../core");
const Util_1 = require("../../util/Util");
const UuidUtil_1 = require("../../util/UuidUtil");
const INVOCATION_RETRY_PAUSE_MILLIS = 'hazelcast.client.invocation.retry.pause.millis';
const MAX_PUT_RETRY_COUNT = 'hazelcast.client.schema.max.put.retry.count';
/**
 * Service to put and get metadata to cluster.
 * @internal
 */
class SchemaService {
    constructor(clientConfig, getClusterService, 
    // a getter is used because there is a cyclic dependency between InvocationService and SchemaService
    getInvocationService, logger) {
        this.getClusterService = getClusterService;
        this.getInvocationService = getInvocationService;
        this.logger = logger;
        this.schemas = new Map();
        this.retryPauseMillis = clientConfig.properties[INVOCATION_RETRY_PAUSE_MILLIS];
        this.maxPutRetryCount = clientConfig.properties[MAX_PUT_RETRY_COUNT];
    }
    /**
     * Fetches the schema with id {@link schemaId} from cluster to local registry of the schema service.
     */
    fetchSchema(schemaId) {
        const invocation = new InvocationService_1.Invocation(this.getInvocationService(), ClientFetchSchemaCodec_1.ClientFetchSchemaCodec.encodeRequest(schemaId));
        invocation.handler = ClientFetchSchemaCodec_1.ClientFetchSchemaCodec.decodeResponse;
        return this.getInvocationService().invoke(invocation).then(schema => {
            if (schema !== null) {
                this.putIfAbsent(schema);
                this.logger.trace('SchemaService', `Found schema id ${schemaId} on the cluster`);
            }
            else {
                this.logger.trace('SchemaService', `Did not find schema id ${schemaId} on the cluster`);
                throw new core_1.HazelcastSerializationError(`The schema can not be found with id ${schemaId}`);
            }
        });
    }
    /**
     * Returns the schema with id {@link schemaId} in schema service's local registry,
     * returning `undefined` if it is not found.
     */
    get(schemaId) {
        return this.schemas.get(schemaId.toString());
    }
    /**
     * Puts the schema with the given id to the cluster.
     */
    put(schema) {
        const schemaId = schema.schemaId;
        const existingSchema = this.schemas.get(schemaId.toString());
        if (existingSchema !== undefined) {
            this.logger.trace('SchemaService', `Schema id ${schemaId} already exists locally`);
            return Promise.resolve();
        }
        return this.replicateSchemaInCluster(schema).then((result) => {
            if (!result) {
                throw new core_1.IllegalStateError(`The schema ${schema.typeName} cannot be replicated in the cluster, after ${this.maxPutRetryCount}  retries. 
                    It might be the case that the client is connected to the two halves of the cluster that 
                    is experiencing a split-brain, and continue putting the data associated with that schema might 
                    result in data loss. It might be possible to replicate the schema after some time, when 
                    the cluster is healed.`);
            }
            this.putIfAbsent(schema);
        });
    }
    putIfAbsent(schema) {
        const schemaId = schema.schemaId;
        const existingSchema = this.schemas.get(schemaId.toString());
        if (existingSchema === undefined) {
            this.logger.trace('SchemaService', `Added schema with id ${schemaId} locally`);
            this.schemas.set(schemaId.toString(), schema);
            return;
        }
        if (!existingSchema.equals(schema)) {
            throw new core_1.IllegalStateError(`Schema with schemaId ${schemaId} already exists. existing schema: ${existingSchema} new schema: ${schema}`);
        }
    }
    sendAllSchemas() {
        if (this.schemas.size === 0) {
            this.logger.trace('SchemaService', 'There is no schemas to send to the cluster');
            return Promise.resolve();
        }
        this.logger.trace('SchemaService', `Sending ${this.schemas.size} schemas to the cluster ${this.schemas}`);
        const message = ClientSendAllSchemasCodec_1.ClientSendAllSchemasCodec.encodeRequest([...this.schemas.values()]);
        const invocation = new InvocationService_1.Invocation(this.getInvocationService(), message);
        return this.getInvocationService().invokeUrgent(invocation).then(() => { });
    }
    hasAnySchemas() {
        return !(this.schemas.size === 0);
    }
    replicateSchemaInCluster(schema) {
        const clientMessage = ClientSendSchemaCodec_1.ClientSendSchemaCodec.encodeRequest(schema);
        return this.retryMaxPutRetryCount(clientMessage, 0);
    }
    retryMaxPutRetryCount(clientMessage, currentRetryCount) {
        if (currentRetryCount === this.maxPutRetryCount) {
            return Promise.resolve(false);
        }
        const invocationService = this.getInvocationService();
        const invocation = new InvocationService_1.Invocation(invocationService, clientMessage);
        return invocationService.invoke(invocation).then((response) => {
            const replicatedMemberUuids = UuidUtil_1.UuidUtil.convertUUIDSetToStringSet(ClientSendSchemaCodec_1.ClientSendSchemaCodec.decodeResponse(response));
            const members = this.getClusterService().getMembers();
            for (const member of members) {
                if (!replicatedMemberUuids.has(member.uuid.toString())) {
                    // There is a member in our member list that the schema
                    // is not known to be replicated yet. We should retry
                    // sending it in a random member.
                    return (0, Util_1.delayedPromise)(this.retryPauseMillis).then(() => {
                        // correlation id will be set when the invoke method is
                        // called above
                        clientMessage = clientMessage.copyMessageWithSharedNonInitialFrames();
                        return this.retryMaxPutRetryCount(clientMessage, ++currentRetryCount);
                    });
                }
            }
            // All members in our member list all known to have the schema
            return Promise.resolve(true);
        });
    }
}
exports.SchemaService = SchemaService;
//# sourceMappingURL=SchemaService.js.map