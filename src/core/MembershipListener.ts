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

import {Member} from './Member';

/**
 * Membership event fired when a new member is added to the cluster and/or
 * when a member leaves the cluster or when there is a member attribute change.
 */
export class MembershipEvent {

    /**
     * Removed or added member.
     */
    member: Member;

    /**
     * Members list at the moment after this event.
     */
    members: Member[];

    /** @internal */
    eventType: MemberEvent;

    /** @internal */
    constructor(member: Member, eventType: MemberEvent, members: Member[]) {
        this.member = member;
        this.eventType = eventType;
        this.members = members;
    }

}

/** @internal */
export enum MemberEvent {

    ADDED = 1,
    REMOVED = 2,

}

/**
 * Cluster membership listener.
 */
export interface MembershipListener {

    /**
     * Invoked when a new member is added to the cluster.
     *
     * @param {MembershipEvent} event event object
     */
    memberAdded?(event: MembershipEvent): void;

    /**
     * Invoked when an existing member leaves the cluster.
     *
     * @param {MembershipEvent} event event object
     */
    memberRemoved?(event: MembershipEvent): void;

}

/**
 * An event that is sent when a {@link InitialMembershipListener} registers itself on a cluster.
 *
 * @see MembershipListener
 * @see MembershipEvent
 */
export class InitialMembershipEvent {

    members: Member[];

    /** @internal */
    constructor(members: Member[]) {
        this.members = members;
    }
}

/**
 * The InitialMembershipListener is a {@link MembershipListener} that first
 * receives an {@link InitialMembershipEvent} when it is registered, so it
 * immediately knows which members are available. After that event has
 * been received, it will receive the normal MembershipEvents.
 *
 * When the InitialMembershipListener already is registered on a cluster
 * and is registered again on the same Cluster instance, it will not
 * receive an additional MembershipInitializeEvent. This is a once only event.
 */
export interface InitialMembershipListener extends MembershipListener {

    /**
     * Called when this listener is registered.
     *
     * @param event the MembershipInitializeEvent received when the listener is registered
     */
    init(event: InitialMembershipEvent): void;

}
