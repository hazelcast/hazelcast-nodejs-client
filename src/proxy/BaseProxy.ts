import {SerializationService} from '../serialization/SerializationService';
export class BaseProxy {

    protected client : any;
    private name : string;
    private serviceName : string;

    //TODO client should be of type {real client type}
    constructor(client : { serializationService : SerializationService}, serviceName: string, name: string) {
        this.client = client;
        this.name = name;
        this.serviceName = serviceName;
    }

    protected toData(object : any) : Buffer {
        return this.client.serializationService.toData(object);
    }

    protected toObject(buffer : Buffer) : any {
        return this.client.serializationService.toObject(buffer);
    }
}
