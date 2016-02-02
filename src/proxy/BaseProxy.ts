import {SerializationService} from '../serialization/SerializationService';
import {Data} from '../serialization/Data';
import HazelcastClient = require('../HazelcastClient');
export class BaseProxy {

    protected client: HazelcastClient;
    private name: string;
    private serviceName: string;

    constructor(client: HazelcastClient, serviceName: string, name: string) {
        this.client = client;
        this.name = name;
        this.serviceName = serviceName;
    }

    protected toData(object: any): Data {
        return this.client.getSerializationService().toData(object);
    }

    protected toObject(data: Data): any {
        return this.client.getSerializationService().toObject(data);
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
