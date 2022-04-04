/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
/** @ignore *//** */

import {AbstractLoadBalancer} from '../core/LoadBalancer';
import {Member} from '../core/Member';
import {randomInt} from '../util/Util';

/**
 * A {@link LoadBalancer} that selects a random member to route to.
 * @internal
 */
export class RandomLB extends AbstractLoadBalancer {
    next(): Member | null {
        return this._next(false);
    }

    private _next(dataMember: boolean): Member | null {
        const members = dataMember ? this.getDataMembers() : this.getMembers();
        if (members == null || members.length === 0) {
            return null;
        }
        const index = randomInt(members.length);
        return members[index];
    }

    canGetNextDataMember(): boolean {
        return true;
    }

    nextDataMember(): Member | null {
        return this._next(true);
    }
}
