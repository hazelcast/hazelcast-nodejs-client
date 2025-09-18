"use strict";
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
/** @ignore */ /** */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RandomLB = void 0;
const LoadBalancer_1 = require("../core/LoadBalancer");
const Util_1 = require("../util/Util");
/**
 * A {@link LoadBalancer} that selects a random member to route to.
 * @internal
 */
class RandomLB extends LoadBalancer_1.AbstractLoadBalancer {
    next() {
        return this._next(false);
    }
    _next(dataMember) {
        const members = dataMember ? this.getDataMembers() : this.getMembers();
        if (members == null || members.length === 0) {
            return null;
        }
        const index = (0, Util_1.randomInt)(members.length);
        return members[index];
    }
    canGetNextDataMember() {
        return true;
    }
    nextDataMember() {
        return this._next(true);
    }
}
exports.RandomLB = RandomLB;
//# sourceMappingURL=RandomLB.js.map