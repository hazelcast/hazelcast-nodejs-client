import * as Long from 'long';
import {Schema} from './Schema';
import {ILogger} from '../../logging';
import {Invocation, InvocationService} from '../../invocation/InvocationService';
import {ClientSendAllSchemasCodec} from '../../codec/ClientSendAllSchemasCodec';
import {ClientFetchSchemaCodec} from '../../codec/ClientFetchSchemaCodec';
import {ClientSendSchemaCodec} from '../../codec/ClientSendSchemaCodec';


export interface ISchemaService {
    get(schemaId: Long): Schema | null;
    fetchSchema(schemaId: Long): Promise<void>;
    putLocal(schema: Schema): void;
}


export class SchemaService implements ISchemaService {
    schemas: Map<string, Schema>;

    constructor(
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
    }

    putLocal(schema: Schema): void {
        this.putIfAbsent(schema);
    }

    sendAllSchemas() : Promise<void> {
        if (this.schemas.size === 0) {
            this.logger.trace('SchemaService', 'There is no schemas to send to the cluster');
            return Promise.resolve();
        }
        this.logger.trace('SchemaService', `Sending ${this.schemas.size} schemas to the cluster ${this.schemas}`);
        const message = ClientSendAllSchemasCodec.encodeRequest([...this.schemas.values()]);
        const invocation = new Invocation(this.getInvocationService(), message);
        return this.getInvocationService().invoke(invocation).then(() => {});
    }

}
