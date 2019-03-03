/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
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

import {MemberAttributeEvent} from './MemberAttributeEvent';
import {MembershipEvent} from './MembershipEvent';

/**
 * Cluster membership listener.
 */
export interface MembershipListener {
    /**
     * Invoked when a new member is added to the cluster.
     * @param {MembershipEvent} membership event
     */
    memberAdded(membership: MembershipEvent): void;

    /**
     * Invoked when an existing member leaves the cluster.
     * @param {MembershipEvent} membership event when an existing member leaves the cluster
     */
    memberRemoved(membership: MembershipEvent): void;

    /**
     * Invoked when an attribute of a member was changed.
     * @param {MemberAttributeEvent} member attribute event when an attribute of a member was changed
     */
    memberAttributeChanged(memberAttributeEvent: MemberAttributeEvent): void;
}
