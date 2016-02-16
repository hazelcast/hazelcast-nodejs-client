import {SerializationService} from '../serialization/SerializationService';
import {Data} from '../serialization/Data';
import HazelcastClient = require('../HazelcastClient');
import ClientMessage = require('../ClientMessage');
import Q = require('q');
export class BaseProxy {

    protected client: HazelcastClient;
    protected name: string;
    protected serviceName: string;

    constructor(client: HazelcastClient, serviceName: string, name: string) {
        this.client = client;
        this.name = name;
        this.serviceName = serviceName;
    }

    private createPromise<T>(codec: any, promise: Q.Promise<ClientMessage>): Q.Promise<T> {
        var deferred: Q.Deferred<T> = Q.defer<T>();
        var that = this;
        promise.then(function(clientMessage: ClientMessage) {
            var parameters: any = codec.decodeResponse(clientMessage);
            deferred.resolve(that.toObject(parameters.response));
        });
        return deferred.promise;
    }

    protected encodeInvokeOnKey<T>(codec: any, key: any, ...codecArguments: any[]): Q.Promise<T> {
        var partitionId: number = this.client.getPartitionService().getPartitionId(key);
        return this.encodeInvokeOnPartition<T>(codec, partitionId, ...codecArguments);
    }

    protected encodeInvokeOnPartition<T>(codec: any, partitionId: number, ...codecArguments: any[]): Q.Promise<T> {
        var clientMessage = codec.encodeRequest(this.name, ...codecArguments);
        var invocationResponse: Q.Promise<ClientMessage> = this.client.getInvocationService()
            .invokeOnPartition(clientMessage, partitionId);

        return this.createPromise<T>(codec, invocationResponse);
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
