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

import {MembershipEvent} from './MembershipEvent';
import {InitialMembershipListener} from './InitialMembershipListener';
import {Member} from './Member';

/**
 * An event that is sent when a {@link InitialMembershipListener} registers itself on a cluster. For more
 * information, see the {@link InitialMembershipListener}.
 *
 * @see MembershipListener
 * @see MembershipEvent
 */
export class InitialMembershipEvent {
    members: Member[];

    constructor(members: Member[]) {
        this.members = members;
    }
}
