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
'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { ClientConfigImpl } = require('../../lib/config/Config');
const { MemberInfo } = require('../../lib/core/MemberInfo');
const { ClusterService, INITIAL_MEMBER_LIST_VERSION } = require('../../lib/invocation/ClusterService');
const { AddressImpl } = require('../../');
const { UuidUtil } = require('../../lib/util/UuidUtil');
const { DefaultLogger } = require('../../lib/logging/DefaultLogger');

describe('ClientClusterServiceImplTest', function () {
    let loggerStub;
    let clusterFailoverServiceStub;
    let clusterService;
    beforeEach(async function () {
        loggerStub = sandbox.stub(DefaultLogger.prototype);
        clusterFailoverServiceStub = {
            current: () => {
                return {};
            }
        };
        clusterService = new ClusterService(
            new ClientConfigImpl(),
            loggerStub,
            clusterFailoverServiceStub
        );
        clusterService.translateToAddressProvider.refresh = () => {
            return Promise.resolve();
        };
    });

    afterEach(async function () {
        sandbox.restore();
    });

    function createMember({host, port, uuid, liteMember}) {
        const address = new AddressImpl(host, port);
        const memberUUID = uuid ? uuid : UuidUtil.generate();
        return new MemberInfo(address, memberUUID, new Map(), liteMember, '', false, null);
    }

    it('testMemberAdded', async function () {
        const members = [];
        const membershipListener = {
            memberAdded: (event) => {
                members.push(event.member);
            },
            memberRemoved: () => {}
        };
        clusterService.addMembershipListener(membershipListener);

        const member = createMember({host:'127.0.0.1', port:5701, uuid:null, liteMember:false});
        const clusterUUID = UuidUtil.generate();
        // triggers initial event
        clusterService.handleMembersViewEvent(clusterUUID, 1, [member]);
        // triggers member added
        const memberInfo = createMember({host:'127.0.0.2', port:5701, uuid:null, liteMember:false});
        clusterService.handleMembersViewEvent(clusterUUID, 2, [member, memberInfo]);
        expect(clusterService.getMembers().length).to.be.equal(2);
        expect(members).to.eql([memberInfo]);
    });

    it('testMemberRemoved', async function () {
        const members = [];

        const memberInfo = createMember({host:'127.0.0.1', port:5701, uuid:null, liteMember:false});
        const clusterUUID = UuidUtil.generate();
        clusterService.handleMembersViewEvent(clusterUUID, 1, [memberInfo]);

        const membershipListener = {
            memberAdded: () => {},
            memberRemoved: (event) => {
                members.push(event.member);
            }
        };
        clusterService.addMembershipListener(membershipListener);
        clusterService.handleMembersViewEvent(clusterUUID, 2, []);
        expect(clusterService.getMembers().length).to.be.equal(0);
        expect(members).to.eql([memberInfo]);
    });

    it('testInitialMembershipListener_AfterInitialListArrives', async function () {
        let initCounter = 0;
        const memberInfo = createMember({host:'127.0.0.1', port:5701, uuid:null, liteMember:false});
        const clusterUUID = UuidUtil.generate();
        clusterService.handleMembersViewEvent(clusterUUID, 1, [memberInfo]);

        const membershipListener = {
            memberAdded: () => {},
            memberRemoved: () => {},
            init: () => {
                initCounter++;
            }
        };
        clusterService.addMembershipListener(membershipListener);
        expect(initCounter).to.be.equal(1);
    });

    it('testInitialMembershipListener_BeforeInitialListArrives', async function () {
        let initCounter = 0;

        const membershipListener = {
            memberAdded: () => {},
            memberRemoved: () => {},
            init: () => {
                initCounter++;
            }
        };
        clusterService.addMembershipListener(membershipListener);
        const memberInfo = createMember({host:'127.0.0.1', port:5701, uuid:null, liteMember:false});
        const clusterUUID = UuidUtil.generate();
        clusterService.handleMembersViewEvent(clusterUUID, 1, [memberInfo]);
        expect(initCounter).to.be.equal(1);
    });

    it('testFireOnlyIncrementalEvents_AfterClusterRestart', async function () {
        let initCounter = 0;
        const addedMembers = [];
        const removedMembers = [];

        const removedMemberInfo = createMember({host:'127.0.0.1', port:5701, uuid:null, liteMember:false});
        clusterService.handleMembersViewEvent(UuidUtil.generate(), 1, [removedMemberInfo]);

        const membershipListener = {
            memberAdded: (event) => {
                addedMembers.push(event.member);
            },
            memberRemoved: (event) => {
                removedMembers.push(event.member);
            },
            init: () => {
                initCounter++;
            }
        };
        clusterService.addMembershipListener(membershipListener);
        // called on cluster restart
        clusterService.onClusterConnect();

        const addedMemberInfo = createMember({host:'127.0.0.2', port:5701, uuid:null, liteMember:false});
        clusterService.handleMembersViewEvent(UuidUtil.generate(), 1, [addedMemberInfo]);
        expect(clusterService.getMembers().length).to.be.equal(1);
        expect(initCounter).to.be.equal(1);
        expect(addedMembers).to.eql([addedMemberInfo]);
        expect(removedMembers).to.eql([removedMemberInfo]);
    });

    it('testFireOnlyInitialEvent_AfterClusterChange', async function () {
        let initCounter = 0;
        let addedCount = 0;
        let removedCount = 0;

        const member1 = createMember({host:'127.0.0.1', port:5701, uuid:null, liteMember:false});
        clusterService.handleMembersViewEvent(UuidUtil.generate(), 1, [member1]);

        const membershipListener = {
            memberAdded: () => {
                addedCount++;
            },
            memberRemoved: () => {
                removedCount++;
            },
            init: () => {
                initCounter++;
            }
        };
        clusterService.addMembershipListener(membershipListener);
        // called on cluster change
        clusterService.onTryToConnectNextCluster();

        clusterService.handleMembersViewEvent(UuidUtil.generate(), 1, [member1]);
        expect(clusterService.getMembers().length).to.be.equal(1);
        expect(initCounter).to.be.equal(2);
        expect(addedCount).to.be.equal(0);
        expect(removedCount).to.be.equal(0);
    });

    it('testDontFire_WhenReconnectToSameCluster', async function () {
        let initCounter = 0;
        let addedCount = 0;
        let removedCount = 0;

        const clusterUUID = UuidUtil.generate();
        const member1 = createMember({host:'127.0.0.1', port:5701, uuid:null, liteMember:false});
        clusterService.handleMembersViewEvent(clusterUUID, 1, [member1]);

        const membershipListener = {
            memberAdded: () => {
                addedCount++;
            },
            memberRemoved: () => {
                removedCount++;
            },
            init: () => {
                initCounter++;
            }
        };
        clusterService.addMembershipListener(membershipListener);
        // called on reconnect to same cluster when registering the listener back
        clusterService.onClusterConnect();

        clusterService.handleMembersViewEvent(clusterUUID, 1, [member1]);
        expect(clusterService.getMembers().length).to.be.equal(1);
        expect(initCounter).to.be.equal(1);
        expect(addedCount).to.be.equal(0);
        expect(removedCount).to.be.equal(0);
    });

    it('testFireEvents_WhenAddressOfTheMembersChanges', async function () {
        let initCounter = 0;
        const addedMembers = [];
        const removedMembers = [];

        const clusterUUID = UuidUtil.generate();
        const member1uuid = UuidUtil.generate();
        const member2uuid = UuidUtil.generate();

        const removedMember1 = createMember({host:'127.0.0.1', port:5701, uuid:member1uuid, liteMember:false});
        const removedMember2 = createMember({host:'127.0.0.2', port:5701, uuid:member2uuid, liteMember:false});
        clusterService.handleMembersViewEvent(clusterUUID, 1, [removedMember1, removedMember2]);

        const membershipListener = {
            memberAdded: (event) => {
                addedMembers.push(event.member);
            },
            memberRemoved: (event) => {
                removedMembers.push(event.member);
            },
            init: () => {
                initCounter++;
            }
        };
        clusterService.addMembershipListener(membershipListener);
        // called on reconnect to same cluster when registering the listener back
        clusterService.onClusterConnect();

        const addedMember1 = createMember({host:'127.0.0.1', port:5701, uuid:member2uuid, liteMember:false});
        const addedMember2 = createMember({host:'127.0.0.2', port:5701, uuid:member1uuid, liteMember:false});
        clusterService.handleMembersViewEvent(clusterUUID, 1, [addedMember1, addedMember2]);
        expect(clusterService.getMembers().length).to.be.equal(2);
        expect(initCounter).to.be.equal(1);
        expect(addedMembers).to.eql([addedMember1, addedMember2]);
        expect(removedMembers).to.eql([removedMember1, removedMember2]);
    });

    it('testFireEvents_WhenAddressAndUuidsDoesNotChange', async function () {
        let initCounter = 0;
        const addedMembers = [];
        const removedMembers = [];

        const clusterUUID = UuidUtil.generate();

        const member1 = createMember({host:'127.0.0.1', port:5701, uuid:null, liteMember:false});
        const member2 = createMember({host:'127.0.0.2', port:5701, uuid:null, liteMember:false});
        clusterService.handleMembersViewEvent(clusterUUID, 1, [member1, member2]);

        const membershipListener = {
            memberAdded: (event) => {
                addedMembers.push(event.member);
            },
            memberRemoved: (event) => {
                removedMembers.push(event.member);
            },
            init: () => {
                initCounter++;
            }
        };
        clusterService.addMembershipListener(membershipListener);
        // called on reconnect to same cluster when registering the listener back
        clusterService.onClusterConnect();

        clusterService.handleMembersViewEvent(UuidUtil.generate(), 1, [member1, member2]);
        expect(clusterService.getMembers().length).to.be.equal(2);
        expect(initCounter).to.be.equal(1);
        expect(addedMembers).to.eql([member1, member2]);
        expect(removedMembers).to.eql([member1, member2]);
    });

    it('testDontServeEmptyMemberList_DuringClusterRestart', async function () {
        const member1 = createMember({host:'127.0.0.1', port:5701, uuid:null, liteMember:false});
        clusterService.handleMembersViewEvent(UuidUtil.generate(), 1, [member1]);
        expect(clusterService.getMembers().length).to.be.equal(1);

        // called on cluster restart
        clusterService.onClusterConnect();

        expect(clusterService.getMembers().length).to.be.equal(1);

        const member2 = createMember({host:'127.0.0.2', port:5701, uuid:null, liteMember:false});
        clusterService.handleMembersViewEvent(UuidUtil.generate(), 1, [member2]);
        expect(clusterService.getMembers().length).to.be.equal(1);
    });

    it('testDontServeEmptyMemberList_DuringClusterChange', async function () {
        const member1 = createMember({host:'127.0.0.1', port:5701, uuid:null, liteMember:false});
        clusterService.handleMembersViewEvent(UuidUtil.generate(), 1, [member1]);
        expect(clusterService.getMembers().length).to.be.equal(1);

        // called on cluster change
        clusterService.onTryToConnectNextCluster();

        expect(clusterService.getMembers().length).to.be.equal(1);
        expect(clusterService.getMemberListVersion()).to.be.equal(INITIAL_MEMBER_LIST_VERSION);
        const member2 = createMember({host:'127.0.0.2', port:5701, uuid:null, liteMember:false});
        clusterService.handleMembersViewEvent(UuidUtil.generate(), 1, [member2]);
        expect(clusterService.getMembers().length).to.be.equal(1);
    });

    it('testListenersFromConfigWorking', async function () {
        const addedMembers = [];
        const membershipListener = {
            memberAdded: (event) => {
                addedMembers.push(event.member);
            },
            memberRemoved: () => {}
        };
        clusterService.start([membershipListener]);

        const member1 = createMember({host:'127.0.0.1', port:5701, uuid:null, liteMember:false});
        const clusterUUID = UuidUtil.generate();
        // triggers initial event
        clusterService.handleMembersViewEvent(clusterUUID, 1, [member1]);
        // triggers member added
        const addedMemberInfo = createMember({host:'127.0.0.2', port:5701, uuid:null, liteMember:false});
        clusterService.handleMembersViewEvent(clusterUUID, 2, [member1, addedMemberInfo]);
        expect(addedMembers).to.eql([addedMemberInfo]);
    });

    it('testRemoveListener', async function () {
        let addedCount = 0;
        const membershipListener = {
            memberAdded: () => {
                addedCount++;
            },
            memberRemoved: () => {}
        };
        const listenerUuid = clusterService.addMembershipListener(membershipListener);
        expect(clusterService.removeMembershipListener(listenerUuid)).to.be.true;
        const member1 = createMember({host:'127.0.0.1', port:5701, uuid:null, liteMember:false});
        const clusterUUID = UuidUtil.generate();
        // triggers initial event
        clusterService.handleMembersViewEvent(clusterUUID, 1, [member1]);
        // triggers member added
        const member2 = createMember({host:'127.0.0.2', port:5701, uuid:null, liteMember:false});
        clusterService.handleMembersViewEvent(clusterUUID, 2, [member2]);
        // we have removed the listener. No event should be fired to our listener
        expect(addedCount).to.be.equal(0);
    });

    it('testRemoveNonExistingListener', async function () {
        expect(clusterService.removeMembershipListener(UuidUtil.generate())).to.be.false;
    });

    it('testGetMember', async function () {
        const masterMember = createMember({host:'127.0.0.1', port:5701, uuid:null, liteMember:false});
        const member2Uuid = UuidUtil.generate();
        const member2 = createMember({host:'127.0.0.2', port:5701, uuid:member2Uuid, liteMember:false});
        clusterService.handleMembersViewEvent(UuidUtil.generate(), 1, [masterMember, member2]);
        const receivedMember = clusterService.getMember(member2Uuid.toString());
        expect(member2).to.eql(receivedMember);
    });

    it('testGetMembers', async function () {
        const masterMember = createMember({host:'127.0.0.1', port:5701, uuid:null, liteMember:false});
        const liteMember = createMember({host:'127.0.0.2', port:5701, uuid:null, liteMember:true});
        const dataMember = createMember({host:'127.0.0.3', port:5701, uuid:null, liteMember:false});
        clusterService.handleMembersViewEvent(UuidUtil.generate(), 1,
            [masterMember, liteMember, dataMember]);
        expect([masterMember, liteMember, dataMember]).to.eql(clusterService.getMemberList());
        expect([liteMember]).to.eql(clusterService.getMembers((selector) => {
            return selector.liteMember;
        }));
        expect([masterMember, dataMember]).to.eql(clusterService.getMembers((selector) => {
            return !selector.liteMember;
        }));
    });
});
