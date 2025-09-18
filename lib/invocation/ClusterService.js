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
exports.ClusterService = exports.INITIAL_MEMBER_LIST_VERSION = void 0;
const Util_1 = require("../util/Util");
const UuidUtil_1 = require("../util/UuidUtil");
const TranslateAddressProvider_1 = require("../network/TranslateAddressProvider");
const core_1 = require("../core");
class MemberListSnapshot {
    constructor(version, members, memberList, clusterUuid) {
        this.version = version;
        this.members = members;
        this.memberList = memberList;
        this.clusterUuid = clusterUuid;
    }
}
/**
 * Initial list version is used at the start and also after cluster has changed with blue-green deployment feature.
 * In both cases, we need to fire InitialMembershipEvent.
 */
exports.INITIAL_MEMBER_LIST_VERSION = -1;
const INITIAL_MEMBERS_TIMEOUT_IN_MILLIS = 120 * 1000; // 120 seconds
/**
 * Manages the relationship of this client with the cluster.
 * @internal
 */
class ClusterService {
    constructor(clientConfig, logger, clusterFailoverService) {
        this.logger = logger;
        this.clusterFailoverService = clusterFailoverService;
        this.listeners = new Map();
        this.initialListFetched = (0, Util_1.deferredPromise)();
        this.memberListSnapshot = new MemberListSnapshot(exports.INITIAL_MEMBER_LIST_VERSION, new Map(), [], null);
        this.translateToAddressProvider = new TranslateAddressProvider_1.TranslateAddressProvider(clientConfig, logger);
    }
    /**
     * Gets the member with the given UUID.
     *
     * @param uuid The UUID of the member as a string.
     * @return The member that was found, or undefined if not found.
     */
    getMember(uuid) {
        return this.memberListSnapshot.members.get(uuid);
    }
    getMembers(selector) {
        const members = this.getMemberList();
        if (selector === undefined) {
            return members;
        }
        const selectedMembers = [];
        members.forEach((member) => {
            if (selector(member)) {
                selectedMembers.push(member);
            }
        });
        return selectedMembers;
    }
    /**
     * Gets the current number of members.
     *
     * @return The current number of members.
     */
    getSize() {
        return this.memberListSnapshot.members.size;
    }
    addMembershipListener(listener) {
        (0, Util_1.assertNotNull)(listener);
        const registrationId = UuidUtil_1.UuidUtil.generate().toString();
        this.listeners.set(registrationId, listener);
        if (ClusterService.isInitialMembershipListener(listener)) {
            const members = this.getMemberList();
            // if members are empty,it means initial event did not arrive yet
            // it will be redirected to listeners when it arrives, see #handleInitialMembershipEvent
            if (members.length !== 0) {
                const event = new core_1.InitialMembershipEvent(this, members);
                listener.init(event);
            }
        }
        return registrationId;
    }
    removeMembershipListener(listenerId) {
        (0, Util_1.assertNotNull)(listenerId);
        return this.listeners.delete(listenerId);
    }
    start(configuredListeners) {
        for (const listener of configuredListeners) {
            this.addMembershipListener(listener);
        }
    }
    onClusterConnect() {
        this.logger.trace('ClusterService', 'Resetting the member list version.');
        // This check is necessary so in order not to override changing cluster information when:
        // - registering cluster view listener back to the new cluster.
        // - on authentication response when cluster uuid change is detected.
        if (this.memberListSnapshot.version !== exports.INITIAL_MEMBER_LIST_VERSION) {
            this.memberListSnapshot =
                new MemberListSnapshot(0, this.memberListSnapshot.members, this.memberListSnapshot.memberList, this.memberListSnapshot.clusterUuid);
        }
    }
    onTryToConnectNextCluster() {
        this.logger.trace('ClusterService', 'Resetting the cluster snapshot.');
        this.initialListFetched = (0, Util_1.deferredPromise)();
        this.memberListSnapshot =
            new MemberListSnapshot(exports.INITIAL_MEMBER_LIST_VERSION, this.memberListSnapshot.members, this.memberListSnapshot.memberList, this.memberListSnapshot.clusterUuid);
    }
    waitForInitialMemberList() {
        return (0, Util_1.timedPromise)(this.initialListFetched.promise, INITIAL_MEMBERS_TIMEOUT_IN_MILLIS)
            .catch((err) => {
            return Promise.reject(new core_1.IllegalStateError('Could not get initial member list from the cluster!', err));
        });
    }
    // for test usage
    getMemberListVersion() {
        return this.memberListSnapshot.version;
    }
    handleMembersViewEvent(clusterUuid, memberListVersion, memberInfos) {
        const clusterViewSnapshot = this.memberListSnapshot;
        if (clusterViewSnapshot.version == exports.INITIAL_MEMBER_LIST_VERSION) {
            //this means this is the first time client connected to cluster/cluster has changed(blue/green)
            this.applyInitialState(memberListVersion, memberInfos, clusterUuid)
                .then(this.initialListFetched.resolve)
                .catch((err) => {
                this.logger.warn('ClusterService', 'Could not apply initial member list.', err);
            });
            return;
        }
        if (memberListVersion > clusterViewSnapshot.version) {
            const previousClusterUuid = clusterViewSnapshot.clusterUuid;
            const prevMembers = clusterViewSnapshot.memberList;
            const snapshot = ClusterService.createSnapshot(memberListVersion, memberInfos, clusterUuid);
            this.memberListSnapshot = snapshot;
            const currentMembers = snapshot.memberList;
            const events = this.detectMembershipEvents(prevMembers, currentMembers, previousClusterUuid);
            this.fireEvents(events);
        }
    }
    translateToPublicAddress() {
        return this.translateToAddressProvider.get();
    }
    fireEvents(events) {
        for (const event of events) {
            this.listeners.forEach((listener) => {
                if (event.eventType === core_1.MemberEvent.ADDED && listener.memberAdded) {
                    listener.memberAdded(event);
                }
                else if (event.eventType === core_1.MemberEvent.REMOVED && listener.memberRemoved) {
                    listener.memberRemoved(event);
                }
            });
        }
    }
    static isInitialMembershipListener(listener) {
        return listener.init !== undefined;
    }
    applyInitialState(memberListVersion, memberInfos, clusterUuid) {
        const snapshot = ClusterService.createSnapshot(memberListVersion, memberInfos, clusterUuid);
        this.memberListSnapshot = snapshot;
        this.logger.info('ClusterService', ClusterService.membersString(snapshot));
        const members = snapshot.memberList;
        const event = new core_1.InitialMembershipEvent(this, members);
        this.listeners.forEach((listener) => {
            if (ClusterService.isInitialMembershipListener(listener)) {
                listener.init(event);
            }
        });
        const addressProvider = this.clusterFailoverService.current().addressProvider;
        return this.translateToAddressProvider.refresh(addressProvider, memberInfos);
    }
    detectMembershipEvents(prevMembers, currentMembers, clusterUuid) {
        const newMembers = new Array();
        const deadMembers = new Map();
        for (const member of prevMembers) {
            deadMembers.set(member.id(), member);
        }
        for (const member of currentMembers) {
            if (this.memberListSnapshot.clusterUuid.equals(clusterUuid)) {
                if (!deadMembers.delete(member.id())) {
                    newMembers.push(member);
                }
            }
            else {
                // if cluster uuid is not same, then we will not try to match the current members to previous members
                // As a result all previous members are dead and all current members are new members
                newMembers.push(member);
            }
        }
        const events = new Array(deadMembers.size + newMembers.length);
        let index = 0;
        // removal events should be added before added events
        deadMembers.forEach((member) => {
            events[index++] = new core_1.MembershipEvent(member, core_1.MemberEvent.REMOVED, currentMembers);
        });
        for (const member of newMembers) {
            events[index++] = new core_1.MembershipEvent(member, core_1.MemberEvent.ADDED, currentMembers);
        }
        if (events.length !== 0) {
            if (this.memberListSnapshot.members.size !== 0) {
                this.logger.info('ClusterService', ClusterService.membersString(this.memberListSnapshot));
            }
        }
        return events;
    }
    static createSnapshot(memberListVersion, memberInfos, clusterUuid) {
        const newMembers = new Map();
        const newMemberList = new Array(memberInfos.length);
        let index = 0;
        for (const memberInfo of memberInfos) {
            const member = new core_1.MemberImpl(memberInfo.address, memberInfo.uuid, memberInfo.attributes, memberInfo.liteMember, memberInfo.version, memberInfo.addressMap);
            newMembers.set(memberInfo.uuid.toString(), member);
            newMemberList[index++] = member;
        }
        return new MemberListSnapshot(memberListVersion, newMembers, newMemberList, clusterUuid);
    }
    static membersString(snapshot) {
        const members = snapshot.memberList;
        let logString = '\n\nMembers [' + members.length + '] {';
        for (const member of members) {
            logString += '\n\t' + member.toString();
        }
        logString += '\n}\n';
        return logString;
    }
    getMemberList() {
        return this.memberListSnapshot.memberList;
    }
}
exports.ClusterService = ClusterService;
//# sourceMappingURL=ClusterService.js.map