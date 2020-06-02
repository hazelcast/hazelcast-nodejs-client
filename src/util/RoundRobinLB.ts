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

import {AbstractLoadBalancer} from './AbstractLoadBalancer';
import {randomInt} from '../Util';
import {Member} from '../core/Member';

const INITIAL_SEED_CAP = Math.ceil(Number.MAX_SAFE_INTEGER / 1024);

/**
 * A {@link LoadBalancer} implementation that relies on using round robin
 * to a next member to send a request to.
 */
export class RoundRobinLB extends AbstractLoadBalancer {
    private index: number;

    constructor() {
        super();
        let seed = process.hrtime()[1];
        if (seed > INITIAL_SEED_CAP) {
            seed = randomInt(INITIAL_SEED_CAP);
        }
        this.index = seed;
    }

    next(): Member {
        const members = this.getMembers();
        if (members == null || members.length === 0) {
            return null;
        }

        const length = members.length;
        const idx = (this.index++) % length;
        return members[idx];
    }
}
