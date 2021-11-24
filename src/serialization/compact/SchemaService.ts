import * as Long from 'long';
import {Schema} from './Schema';
import {ILogger} from '../../logging';
import {Invocation, InvocationService} from '../../invocation/InvocationService';
import {ClientSendSchemaCodec} from '../../codec/ClientSendSchemaCodec';
import {IllegalStateError} from '../../core';
import {ClientSendAllSchemasCodec} from '../../codec/ClientSendAllSchemasCodec';
import {ClientFetchSchemaCodec} from '../../codec/ClientFetchSchemaCodec';
// import {ClientFetchSchemaCodec} from '../../codec/ClientFetchSchemaCodec';


export interface ISchemaService {
    get(schemaId: Long): Promise<Schema | null>;
    put(schema: Schema): Promise<void>;
    putLocal(schema: Schema): void;
}


export class SchemaService implements ISchemaService {
    schemas: Map<Long, Schema>;

    constructor(
        private readonly getInvocationService: () => InvocationService,
        private readonly logger: ILogger
    ) {
        this.schemas = new Map<Long, Schema>();
    }

    get(schemaId: Long): Promise<Schema | null> {
        const schema = this.schemas.get(schemaId);
        if (schema !== undefined) {
            return Promise.resolve(schema);
        }
        this.logger.trace('SchemaService', `Could not find schema id ${schemaId} locally, will search on the cluster`);
        const invocation = new Invocation(this.getInvocationService(), ClientFetchSchemaCodec.encodeRequest(schemaId));
        return this.getInvocationService().invoke(invocation).then(message => {
            const schema = ClientFetchSchemaCodec.decodeResponse(message);
            if (schema !== null) {
                this.schemas.set(schema.schemaId, schema);
                this.logger.trace('SchemaService', `Found schema id ${schemaId} on the cluster`);
            }
            return schema;
        });
    }

    put(schema: Schema): Promise<void> {
        const schemaId = schema.schemaId;
        const existingSchema = this.schemas.get(schemaId);
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
        const existingSchema = this.schemas.get(schemaId);
        if (existingSchema === undefined) {
            this.logger.trace('SchemaService', `Added schema with id ${schemaId} locally`);
            this.schemas.set(schemaId, schema);
            return;
        }
        if (!existingSchema.equals(schema)) {
            throw new IllegalStateError(
                `Schema with id ${schemaId} already exists.` +
                `Existing schema: ${JSON.stringify(existingSchema)}, New schema: ${JSON.stringify(schema)}`
            );
        }
    }

    putLocal(schema: Schema): void {
        this.putIfAbsent(schema);
    }

    sendAllSchemas() : Promise<void> {
        if (this.schemas.size === 0) {
            this.logger.trace('SchemaService', 'There is no schemas to send to the cluster');
            return Promise.resolve();
        }
        this.logger.trace('SchemaService', `Sending ${this.schemas.size} schemas to the cluster ${JSON.stringify(this.schemas)}`);
        const message = ClientSendAllSchemasCodec.encodeRequest([...this.schemas.values()]);
        const invocation = new Invocation(this.getInvocationService(), message);
        return this.getInvocationService().invoke(invocation).then(() => {});
    }

}
