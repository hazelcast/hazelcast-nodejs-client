import * as Promise from 'bluebird';
import HazelcastClient from './HazelcastClient';
import GetPartitionsCodec = require('./codec/GetPartitionsCodec');
import Address = require('./Address');
import ClientMessage = require('./ClientMessage');

const PARTITION_REFRESH_INTERVAL = 10000;

export class PartitionService {

    private client: HazelcastClient;
    private partitionMap: {[partitionId: number]: Address} = {};
    private partitionCount: number;
    private partitionRefreshTask: any;
    private isShutdown: boolean;

    constructor(client: HazelcastClient) {
        this.client = client;
        this.isShutdown = false;
    }

    initialize(): Promise<void> {
        return this.refresh();
    }

    shutdown(): void {
        this.isShutdown = true;
        clearTimeout(this.partitionRefreshTask);
    }

    /**
     * Refreshes the internal partition table.
     */
    refresh(): Promise<void> {
        if (this.isShutdown) {
            return Promise.resolve();
        }
        var ownerConnection = this.client.getClusterService().getOwnerConnection();
        var clientMessage: ClientMessage = GetPartitionsCodec.encodeRequest();

        return this.client.getInvocationService()
            .invokeOnConnection(ownerConnection, clientMessage)
            .then((clientMessage: ClientMessage) => {
                var receivedPartitionMap = GetPartitionsCodec.decodeResponse(clientMessage);
                for (var partitionId in receivedPartitionMap) {
                    this.partitionMap[partitionId] = receivedPartitionMap[partitionId];
                }
                this.partitionCount = Object.keys(this.partitionMap).length;
            }).finally(() => {
                this.partitionRefreshTask = setTimeout(this.refresh.bind(this), PARTITION_REFRESH_INTERVAL);
            });
    }

    /**
     * Returns the {@link Address} of the node which owns given partition id.
     * @param partitionId
     * @returns the address of the node.
     */
    getAddressForPartition(partitionId: number): Address {
        return this.partitionMap[partitionId];
    }

    /**
     * Computes the partition id for a given key.
     * @param key
     * @returns the partition id.
     */
    getPartitionId(key: any) {
        var partitionHash: number;
        if (typeof key === 'object' && 'getPartitionHash' in key) {
            partitionHash = key.getPartitionHash();
        } else {
            partitionHash = this.client.getSerializationService().toData(key).getPartitionHash();
        }
        return Math.abs(partitionHash) % this.partitionCount;
    }

    getPartitionCount(): number {
        return this.partitionCount;
    }
}
