import {SerializationService} from '../serialization/SerializationService';
import {Data} from '../serialization/Data';
import HazelcastClient = require('../HazelcastClient');
import ClientMessage = require('../ClientMessage');
export class BaseProxy {

    protected client: HazelcastClient;
    protected name: string;
    protected serviceName: string;

    constructor(client: HazelcastClient, serviceName: string, name: string) {
        this.client = client;
        this.name = name;
        this.serviceName = serviceName;
    }

    protected invokeWithPartitionId(clientMessage: ClientMessage, key: any): Q.Promise<ClientMessage> {
        var partitionId: number = Math.abs(this.client.getSerializationService().toData(key).getPartitionHash()) % 271;
        clientMessage.setPartitionId(partitionId);
        return this.client.getInvocationService().invokeNonSmart(clientMessage);
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
