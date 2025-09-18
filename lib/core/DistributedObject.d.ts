/**
 * Base interface for distributed objects.
 */
export interface DistributedObject {
    /**
     * Returns the key of the partition that this DistributedObject is assigned to.
     * For a partitioned data structure, the returned value will not be `null`,
     * but otherwise `undefined`.
     */
    getPartitionKey(): string;
    /**
     * Returns the unique name of this object.
     */
    getName(): string;
    /**
     * Returns the service name for this object.
     */
    getServiceName(): string;
    /**
     * Destroys this object cluster-wide.
     * Clears all resources taken for this object.
     */
    destroy(): Promise<void>;
}
