/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {ClientConfig} from '../config/Config';
import {Cluster} from './Cluster';
import {Member} from './Member';
import {
    InitialMembershipListener,
    InitialMembershipEvent,
    MembershipEvent
} from './MembershipListener';

/**
 * {@link LoadBalancer} allows you to send operations to one of a number of endpoints (Members).
 * It is up to the implementation to use different load balancing policies.
 * <p>
 * If Client is configured with {@link ClientNetworkConfig.smartRouting},
 * only the operations that are not key based will be routed to the endpoint
 * returned by the LoadBalancer. If it is not, the LoadBalancer will not be used.
 * <p>
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
    next(): Member;

    /**
     * Returns the next data member to route to.
     *
     * @return Returns the next data member or null if no data member is available
     * TODO: change exception
     * @throws {Exception} if the operation is not supported by this instance
     */
    nextDataMember(): Member;

    /**
     * Returns whether this instance supports getting data members through a call to {@link #nextDataMember()}.
     * <p>
     * This method is used by components that require communication with data members only, such as the SQL engine.
     *
     * @return true if this instance supports getting data members through a call to {@link #nextDataMember()}
     * @see #nextDataMember()
     */
    canGetNextDataMember(): boolean;


}

/**
 * Abstract Load Balancer to be used in built-in and user-provided
 * {@link LoadBalancer} implementations.
 */
export abstract class AbstractLoadBalancer implements LoadBalancer, InitialMembershipListener {

    private members: Member[];
    private cluster: Cluster;

    abstract next(): Member;

    initLoadBalancer(cluster: Cluster, config: ClientConfig): void {
        this.cluster = cluster;
        cluster.addMembershipListener(this);
    }

    init(event: InitialMembershipEvent): void {
        this.setMembers();
    }

    memberAdded(membership: MembershipEvent): void {
        this.setMembers();
    }

    memberRemoved(membership: MembershipEvent): void {
        this.setMembers();
    }

    protected getMembers(): Member[] {
        return this.members;
    }

    private setMembers(): void {
        this.members = this.cluster.getMembers();
    }
}
