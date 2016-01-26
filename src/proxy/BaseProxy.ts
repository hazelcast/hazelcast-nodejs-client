import {SerializationService} from '../serialization/SerializationService';
import {Data} from '../serialization/Data';
export class BaseProxy {

    protected client: any;
    private name: string;
    private serviceName: string;

    //TODO client should be of type {real client type}
    constructor(client: { serializationService : SerializationService}, serviceName: string, name: string) {
        this.client = client;
        this.name = name;
        this.serviceName = serviceName;
    }

    protected toData(object: any): Data {
        return this.client.serializationService.toData(object);
    }

    protected toObject(data: Data): any {
        return this.client.serializationService.toObject(data);
    }

    public getPartitionKey() : string {
        //TODO
        return '';
    }

    public getName() : string {
        return this.name;
    }

    public getServiceName() : string {
        return this.serviceName;
    }

    public destroy() : Q.Promise<void> {
        //TODO
        return Q.defer<void>().promise;
    }
}
