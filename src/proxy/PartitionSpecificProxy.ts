import {BaseProxy} from './BaseProxy';
import HazelcastClient from '../HazelcastClient';
export class PartitionSpecificProxy extends BaseProxy {

    private partitionId: number;

    constructor(client: HazelcastClient, serviceName: string, name: string) {
        super(client, serviceName, name);
        this.partitionId = this.client.getPartitionService().getPartitionId(this.getPartitionKey());
    }

    protected encodeInvoke<T>(codec: any, ...codecArguments: any[]): Q.Promise<T> {
        return this.encodeInvokeOnPartition<T>(codec, this.partitionId, ...codecArguments);
    }
}
