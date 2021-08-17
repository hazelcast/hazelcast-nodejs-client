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

'use strict';

const { expect } = require('chai');
const { RandomLB } = require('../../../lib/util/RandomLB');
const { RoundRobinLB } = require('../../../lib/util/RoundRobinLB');

describe('LoadBalancerTest', function () {
    const mockMembers = [
        {
            uuid: 0,
            liteMember: true
        },
        {
            uuid: 1,
            liteMember: false
        },
        {
            uuid: 2,
            liteMember: true
        },
        {
            uuid: 3,
            liteMember: false
        },
        {
            uuid: 4,
            liteMember: true
        },
        {
            uuid: 5,
            liteMember: false
        }
    ];

    const mockCluster = {
        addMembershipListener: function () { },
        getMembers: function () {
            return mockMembers;
        }
    };

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
        for (let i = 0; i < 20; i++) {
            members.add(lb.next());
        }

        expect(members.size).to.be.below(mockMembers.length + 1);
        members.forEach((member) => {
            expect(mockMembers).to.include(member);
        });
    });

    it('RandomLB should be able to return next data member', function () {
        const lb = new RandomLB();
        expect(lb.canGetNextDataMember()).to.be.equal(true);
    });

    it('RandomLB with data members', function () {
        const lb = new RandomLB();
        lb.initLoadBalancer(mockCluster);
        lb.init();

        const members = new Set();
        for (let i = 0; i < 20; i++) {
            members.add(lb.nextDataMember());
        }

        let dataMemberCounter = 0;
        mockMembers.forEach(v => {
            if (!v.liteMember) {
                dataMemberCounter++;
            }
        });

        expect(members.size).to.be.below(dataMemberCounter + 1);
        members.forEach((member) => {
            expect(mockMembers).to.include(member);
            expect(member.liteMember).to.be.eq(false);
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
            expect(mockMembers[(firstMember.uuid + i) % mockMembers.length]).to.equal(member);
        }
    });

    it('RoundRobinLB should be able to return next data member', function () {
        const lb = new RoundRobinLB();
        expect(lb.canGetNextDataMember()).to.be.equal(true);
    });

    it('RoundRobinLB with data members', function () {
        const lb = new RoundRobinLB();
        lb.initLoadBalancer(mockCluster);
        lb.init();

        const members = [];
        for (let i = 0; i < 10; i++) {
            members.push(lb.nextDataMember());
        }

        members.forEach((member) => {
            expect(mockMembers).to.include(member);
            expect(member.liteMember).to.be.eq(false);
        });

        const firstMember = members[0];

        const dataMembers = [];
        // Find data members
        mockMembers.forEach((member) => {
            if (!member.liteMember) {
                dataMembers.push(member);
            }
        });

        // Find index of first data member in data members. Load balancer should continue iterating from this index.
        const indexOfFirst = dataMembers.findIndex(v => v.uuid === firstMember.uuid);

        for (let i = 1; i < 10; i++) {
            const member = members[i];
            expect(member).to.equal(dataMembers[(indexOfFirst + i) % dataMembers.length]);
        }
    });
});
