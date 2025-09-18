import { ClientInfo, Cluster, DistributedObject, DistributedObjectListener } from './core';
import { ClientConfig } from './config/Config';
import { ClientFailoverConfig } from './config/FailoverConfig';
import { LifecycleService } from './LifecycleService';
import { PartitionService } from './PartitionService';
import { FlakeIdGenerator, IList, IMap, IQueue, ISet, ITopic, MultiMap, ReplicatedMap, Ringbuffer, PNCounter } from './proxy';
import { CPSubsystem } from './CPSubsystem';
import { SqlService } from './sql/SqlService';
/**
 * Hazelcast client instance. When you want to use Hazelcast's distributed
 * data structures, you must first create a client instance. Multiple
 * instances can be created on a single Node.js process.
 *
 * Client instances should be shut down explicitly.
 */
export declare class HazelcastClient {
    /**
     * Creates a new client object and automatically connects to cluster.
     * @param config Client config. Default client config is used when this parameter
     *               is absent.
     * @throws {@link InvalidConfigurationError} before returning if `config` is not a valid configuration object.
     * @returns a new client instance
     */
    static newHazelcastClient(config?: ClientConfig): Promise<HazelcastClient>;
    /**
     * Creates a client with cluster switch capability. Client will try to connect
     * to alternative clusters according to failover configuration when it disconnects
     * from a cluster.
     *
     * @param failoverConfig Configuration object describing the failover client configs and try count
     * @returns a new client instance
     * @throws {@link InvalidConfigurationError} before returning if the provided failover configuration is not valid
     */
    static newHazelcastFailoverClient(failoverConfig?: ClientFailoverConfig): Promise<HazelcastClient>;
    /**
     * Returns the name of this Hazelcast instance.
     */
    getName(): string;
    /**
     * Gathers information of this local client.
     */
    getLocalEndpoint(): ClientInfo;
    /**
     * Returns all {@link DistributedObject}s, that is all maps, queues, topics, locks etc.
     *
     * The results are returned on a best-effort basis. The result might miss
     * just-created objects and contain just-deleted objects. An existing
     * object can also be missing from the list occasionally. One cluster
     * member is queried to obtain the list.
     *
     * @return the collection of all instances in the cluster
     */
    getDistributedObjects(): Promise<DistributedObject[]>;
    /**
     * Returns the distributed Map instance with given name.
     */
    getMap<K, V>(name: string): Promise<IMap<K, V>>;
    /**
     * Returns the distributed Set instance with given name.
     */
    getSet<E>(name: string): Promise<ISet<E>>;
    /**
     * Returns the distributed Queue instance with given name.
     */
    getQueue<E>(name: string): Promise<IQueue<E>>;
    /**
     * Returns the distributed List instance with given name.
     */
    getList<E>(name: string): Promise<IList<E>>;
    /**
     * Returns the distributed MultiMap instance with given name.
     */
    getMultiMap<K, V>(name: string): Promise<MultiMap<K, V>>;
    /**
     * Returns a distributed Ringbuffer instance with the given name.
     */
    getRingbuffer<E>(name: string): Promise<Ringbuffer<E>>;
    /**
     * Returns a distributed Reliable Topic instance with the given name.
     */
    getReliableTopic<E>(name: string): Promise<ITopic<E>>;
    /**
     * Returns the distributed Replicated Map instance with given name.
     */
    getReplicatedMap<K, V>(name: string): Promise<ReplicatedMap<K, V>>;
    /**
     * Returns the distributed Flake ID Generator instance with given name.
     */
    getFlakeIdGenerator(name: string): Promise<FlakeIdGenerator>;
    /**
     * Returns the distributed PN Counter instance with given name.
     */
    getPNCounter(name: string): Promise<PNCounter>;
    /**
     * Returns the CP subsystem that offers a set of in-memory linearizable
     * data structures.
     */
    getCPSubsystem(): CPSubsystem;
    /**
     * Returns configuration that this instance started with.
     * The returned object should not be modified.
     */
    getConfig(): ClientConfig;
    /**
     * Returns the Cluster to which this client is connected.
     */
    getCluster(): Cluster;
    /**
     * Returns the lifecycle service for this client.
     */
    getLifecycleService(): LifecycleService;
    /**
     * Returns the partition service of this client.
     */
    getPartitionService(): PartitionService;
    /**
     * Returns a service to execute distributed SQL queries.
     *
     * @returns SQL service
     *
     * see {@link SqlService}
     */
    getSql(): SqlService;
    /**
     * Registers a distributed object listener to cluster.
     * @param listener distributed object listener function. This will be called with {@link DistributedObjectEvent}.
     * @returns registration id of the listener.
     */
    addDistributedObjectListener(listener: DistributedObjectListener): Promise<string>;
    /**
     * Removes a distributed object listener from the cluster.
     * @param listenerId id of the listener to be removed.
     * @returns `true` if registration was removed, `false` otherwise.
     */
    removeDistributedObjectListener(listenerId: string): Promise<boolean>;
    /**
     * Shuts down this client instance.
     *
     * @return Shutdown promise. Multiple invocations will return the same promise.
     */
    shutdown(): Promise<void>;
}
