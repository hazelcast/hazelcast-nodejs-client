import { ClientConfig } from '../config/Config';
import { Cluster } from './Cluster';
import { Member } from './Member';
import { InitialMembershipListener, InitialMembershipEvent, MembershipEvent } from './MembershipListener';
/**
 * A {@link LoadBalancer} selects one of the endpoints(Members) for the next send operation that be directed
 * to many endpoints.
 * It is up to the implementation to use different load balancing policies.
 *
 * If the client is a smart client configured with {@link ClientNetworkConfig.smartRouting},
 * only the operations that are not key based will be routed via LoadBalancer.
 * If the client is not a smart client, the LoadBalancer will not be used.
 */
export interface LoadBalancer {
    /**
     * Initializes the LoadBalancer.
     *
     * @param cluster the Cluster this LoadBalancer uses to select members from.
     * @param config  the ClientConfig.
     */
    initLoadBalancer(cluster: Cluster, config: ClientConfig): void;
    /**
     * Returns the next member to route to.
     *
     * @return Returns the next member or `null` if no member is available
     */
    next(): Member | null;
    /**
     * Returns the next data member to route to.
     *
     * @return Returns the next data member or `null` if no data member is available
     * @deprecated Since 5.0, the method is unused
     */
    nextDataMember(): Member | null;
    /**
     * Returns whether this instance supports getting data members through a call to {@link nextDataMember}.
     *
     * @return Returns `true` if this load balancer can get a data member.
     * @deprecated Since 5.0, the method is unused
     */
    canGetNextDataMember(): boolean;
}
/**
 * Abstract Load Balancer to be used by built-in and user-provided
 * {@link LoadBalancer} implementations.
 */
export declare abstract class AbstractLoadBalancer implements LoadBalancer, InitialMembershipListener {
    private members;
    private dataMembers;
    private cluster;
    abstract next(): Member | null;
    abstract nextDataMember(): Member | null;
    abstract canGetNextDataMember(): boolean;
    initLoadBalancer(cluster: Cluster, _config: ClientConfig): void;
    init(_event: InitialMembershipEvent): void;
    memberAdded(_membership: MembershipEvent): void;
    memberRemoved(_membership: MembershipEvent): void;
    protected getDataMembers(): Member[];
    protected getMembers(): Member[];
    private setMembers;
}
