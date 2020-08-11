/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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

import {LoadBalancer} from '../LoadBalancer';
import {InitialMembershipListener} from '../core/InitialMembershipListener';
import {Cluster} from '../core/Cluster';
import {ClientConfig} from '../config/Config';
import {InitialMembershipEvent} from '../core/InitialMembershipEvent';
import {MembershipEvent} from '../core/MembershipEvent';
import {Member} from '../core/Member';

/**
 * Abstract Load Balancer to be used in built-in and user-provided implementations.
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
