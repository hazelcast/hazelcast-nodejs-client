/**
 * Implementing PartitionAware allows one to override the default partitioning scheme.
 * Instead of using the keys themselves to spread the data around the cluster the
 * key contained in `partitionKey` is used.
 * <p/>
 * This provides the user with an ability to contain related keys within the same
 * partition and, consequently, within the same node.
 * <p/>
 * In Hazelcast, disparate data structures will be stored on the same partition,
 * based on the partition key. For example, if "Steve" was used, then the following
 * would be on one partition.
 * <ul>
 *     <li>a customers IMap with an entry of key "Steve"</li>
 *     <li>an orders IMap using a customer key type implementing PartitionAware with key "Steve"</li>
 *     <li>any queue named "Steve"</li>
 *     <li>any PartitionAware object with partition key "Steve"</li>
 * </ul>
 */
export interface PartitionAware<T> {
    /**
     * The key that will be used by Hazelcast to specify the partition.
     * You should give the same key for objects that you want to be in the same partition.
     */
    partitionKey: T;
}
