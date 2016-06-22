import {BaseProxy} from './BaseProxy';
import HazelcastClient from '../HazelcastClient';
import * as Promise from 'bluebird';
export class PartitionSpecificProxy extends BaseProxy {

    private partitionId: number;

    constructor(client: HazelcastClient, serviceName: string, name: string) {
        super(client, serviceName, name);
        this.partitionId = this.client.getPartitionService().getPartitionId(this.getPartitionKey());
    }

    protected encodeInvoke<T>(codec: any, ...codecArguments: any[]): Promise<T> {
        return this.encodeInvokeOnPartition<T>(codec, this.partitionId, ...codecArguments);
    }
}
