import {SerializationService} from '../serialization/SerializationService';
import {Data} from '../serialization/Data';
import ClientMessage = require('../ClientMessage');
import * as Q from 'q';
import HazelcastClient from '../HazelcastClient';

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
        var toObject = this.toObject.bind(this);
        promise.then(function(clientMessage: ClientMessage) {
            if (codec.hasOwnProperty('decodeResponse')) {
                var parameters: any = codec.decodeResponse(clientMessage, toObject);
                deferred.resolve(parameters.response);
            } else {
                deferred.resolve();
            }
        }).catch(function (e) {
            deferred.reject(e);
        });
        return deferred.promise;
    }

    protected encodeInvokeOnKey<T>(codec: any, partitionKey: any, ...codecArguments: any[]): Q.Promise<T> {
        var partitionId: number = this.client.getPartitionService().getPartitionId(partitionKey);
        return this.encodeInvokeOnPartition<T>(codec, partitionId, ...codecArguments);
    }

    protected encodeInvokeOnRandomTarget<T>(codec: any, ...codecArguments: any[]): Q.Promise<T> {
        var clientMessage = codec.encodeRequest(this.name, ...codecArguments);
        var invocationResponse = this.client.getInvocationService().invokeOnRandomTarget(clientMessage);
        return this.createPromise<T>(codec, invocationResponse);
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
        return this.client.getProxyManager().destroyProxy(this.name, this.serviceName);
    }
}
