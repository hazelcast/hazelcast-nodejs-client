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

'use strict';

const RandomLB = require('../../lib').RandomLB;
const RoundRobinLB = require('../../lib').RoundRobinLB;
const expect = require('chai').expect;

describe('LoadBalancerTest', function () {

    const mockMembers = [0, 1, 2];
    const mockCluster = {
        addMembershipListener: function () {},
        getMembers: function () {
            return mockMembers;
        }
    }

    it('RandomLB with no members', function () {
        const lb = new RandomLB();
        const member = lb.next();
        expect(member).to.be.null;
    });

    it('RandomLB with members', function () {
        const lb = new RandomLB();
        lb.initLoadBalancer(mockCluster);
        lb.init();

        const members = new Set();
        for (let i = 0; i < 10; i++) {
            members.add(lb.next());
        }

        expect(members.size).to.be.below(4);
        members.forEach((member) => {
           expect(mockMembers).to.include(member);
        });
    });

    it('RoundRobinLB with no members', function () {
        const lb = new RoundRobinLB();
        const member = lb.next();
        expect(member).to.be.null;
    });

    it('RoundRobinLB with members', function () {
        const lb = new RoundRobinLB();
        lb.initLoadBalancer(mockCluster);
        lb.init();

        const members = [];
        for (let i = 0; i < 10; i++) {
            members.push(lb.next());
        }

        const firstMember = members[0];
        expect(mockMembers).to.include(firstMember);

        for (let i = 1; i < 10; i++) {
            const member = members[i];
            expect(mockMembers[(firstMember + i) % mockMembers.length]).to.equal(member);
        }
    });
});
