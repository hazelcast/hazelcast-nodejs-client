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

    eventType: MemberEvent;

    constructor(member: Member, eventType: MemberEvent, members: Member[]) {
        this.member = member;
        this.eventType = eventType;
        this.members = members;
    }

}

export enum MemberEvent {

    ADDED = 1,
    REMOVED = 2,

}
