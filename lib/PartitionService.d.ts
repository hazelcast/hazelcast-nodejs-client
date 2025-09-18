import { UUID } from './core';
/**
 * Retrieves information about the partition count, the partition owner or the partitionId of a key.
 */
export interface PartitionService {
    /**
     * Returns UUID of owner member for a given partition id.
     *
     * @param partitionId partition id
     * @return UUID of the owner of the partition
     *         or `undefined` if a partition is not assigned yet
     */
    getPartitionOwner(partitionId: number): UUID;
    /**
     * Returns partition count of the connected cluster.
     * If partition table is not fetched yet, this method returns `0`.
     *
     * @return the partition count
     */
    getPartitionCount(): number;
    /**
     * Computes the partition id for a given key.
     *
     * @param key
     * @returns the partition id.
     * @throws {@link ClientOfflineError} if the partition table has not arrived yet.
     * @throws {@link HazelcastSerializationError} if key cannot be serialized
     */
    getPartitionId(key: any): number;
}
