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
/** @ignore *//** */

import {Connection} from '../network/Connection';
import {ClientConfig, ClientConfigImpl} from '../config/Config';
import {MemberSelector} from '../core/MemberSelector';
import {
    assertNotNull,
    deferredPromise,
    timedPromise
} from '../util/Util';
import {UuidUtil} from '../util/UuidUtil';
import {ILogger} from '../logging/ILogger';
import {TranslateAddressProvider} from '../network/TranslateAddressProvider';
import {
    Cluster,
    MemberImpl,
    MembershipListener,
    MembershipEvent,
    MemberEvent,
    InitialMembershipListener,
    InitialMembershipEvent,
    IllegalStateError,
    TargetDisconnectedError
} from '../core';
import {MemberInfo} from '../core/MemberInfo';
import {ClusterFailoverService} from '../ClusterFailoverService';
import {ConnectionRegistry} from '../network/ConnectionManager';

class MemberListSnapshot {
    constructor(
        public version: number,
        public readonly members: Map<string, MemberImpl>,
        public readonly memberList: MemberImpl[]
    ) {}
}

const EMPTY_SNAPSHOT = new MemberListSnapshot(-1, new Map<string, MemberImpl>(), []);
const INITIAL_MEMBERS_TIMEOUT_IN_MILLIS = 120 * 1000; // 120 seconds

/**
 * Manages the relationship of this client with the cluster.
 * @internal
 */
export class ClusterService implements Cluster {

    private readonly listeners: Map<string, MembershipListener> = new Map();
    private readonly translateToAddressProvider: TranslateAddressProvider;
    private initialListFetched = deferredPromise<void>();
    private memberListSnapshot = EMPTY_SNAPSHOT;

    constructor(
        clientConfig: ClientConfig,
        private readonly logger: ILogger,
        private readonly clusterFailoverService: ClusterFailoverService
    ) {
        this.translateToAddressProvider = new TranslateAddressProvider(clientConfig as ClientConfigImpl, logger);
    }

    /**
     * Gets the member with the given UUID.
     *
     * @param uuid The UUID of the member as a string.
     * @return The member that was found, or undefined if not found.
     */
    getMember(uuid: string): MemberImpl {
        assertNotNull(uuid);
        return this.memberListSnapshot.members.get(uuid);
    }

    getMembers(selector?: MemberSelector): MemberImpl[] {
        const members = this.getMemberList();
        if (selector == null) {
            return members;
        }

        const selectedMembers: MemberImpl[] = [];
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
    getSize(): number {
        return this.memberListSnapshot.members.size;
    }

    addMembershipListener(listener: MembershipListener): string {
        assertNotNull(listener);

        const registrationId = UuidUtil.generate().toString();
        this.listeners.set(registrationId, listener);

        if (this.isInitialMembershipListener(listener)) {
            const members = this.getMemberList();
            // if members are empty,it means initial event did not arrive yet
            // it will be redirected to listeners when it arrives, see #handleInitialMembershipEvent
            if (members.length !== 0) {
                const event = new InitialMembershipEvent(members);
                listener.init(event);
            }
        }
        return registrationId;
    }

    removeMembershipListener(listenerId: string): boolean {
        assertNotNull(listenerId);
        return this.listeners.delete(listenerId);
    }

    start(configuredListeners: MembershipListener[]): void {
        for (const listener of configuredListeners) {
            this.addMembershipListener(listener);
        }
    }

    reset(): void {
        this.logger.debug('ClusterService', 'Resetting the cluster snapshot.');
        this.initialListFetched = deferredPromise<void>();
        this.memberListSnapshot = EMPTY_SNAPSHOT;
    }

    waitForInitialMemberList(): Promise<void> {
        return timedPromise(this.initialListFetched.promise, INITIAL_MEMBERS_TIMEOUT_IN_MILLIS)
            .catch((err) => {
                return Promise.reject(new IllegalStateError('Could not get initial member list from the cluster!', err));
            });
    }

    clearMemberListVersion(): void {
        this.logger.trace('ClusterService', 'Resetting the member list version.');
        // This check is necessary so that when handling auth response, it will not
        // intervene with client failover logic
        if (this.memberListSnapshot !== EMPTY_SNAPSHOT) {
            this.memberListSnapshot.version = 0;
        }
    }

    clearMemberList(connectionRegistry: ConnectionRegistry): void {
        this.logger.trace('ClusterService', 'Resetting the member list.');
        // This check is necessary so that when handling auth response, it will not
        // intervene with client failover logic
        if (this.memberListSnapshot !== EMPTY_SNAPSHOT) {
            const previousMembers = this.memberListSnapshot.memberList;
            this.memberListSnapshot = new MemberListSnapshot(0, new Map<string, MemberImpl>(), []);
            const events = this.detectMembershipEvents(previousMembers, [], connectionRegistry);
            this.fireEvents(events);
        }
    }

    handleMembersViewEvent(
        connectionRegistry: ConnectionRegistry,
        memberListVersion: number,
        memberInfos: MemberInfo[]
    ): void {
        if (this.memberListSnapshot === EMPTY_SNAPSHOT) {
            this.applyInitialState(memberListVersion, memberInfos)
                .then(this.initialListFetched.resolve)
                .catch((err) => {
                    this.logger.warn('ClusterService', 'Could not apply initial member list.', err);
                });
            return;
        }

        if (memberListVersion >= this.memberListSnapshot.version) {
            const prevMembers = this.memberListSnapshot.memberList;
            const snapshot = this.createSnapshot(memberListVersion, memberInfos);
            this.memberListSnapshot = snapshot;
            const currentMembers = snapshot.memberList;
            const events = this.detectMembershipEvents(prevMembers, currentMembers, connectionRegistry);
            this.fireEvents(events);
        }
    }

    translateToPublicAddress(): boolean {
        return this.translateToAddressProvider.get();
    }

    private fireEvents(events: MembershipEvent[]): void {
        for (const event of events) {
            this.listeners.forEach((listener) => {
                if (event.eventType === MemberEvent.ADDED && listener.memberAdded) {
                    listener.memberAdded(event);
                } else if (event.eventType === MemberEvent.REMOVED && listener.memberRemoved) {
                    listener.memberRemoved(event);
                }
            });
        }
    }

    private isInitialMembershipListener(listener: MembershipListener): listener is InitialMembershipListener {
        return (listener as InitialMembershipListener).init !== undefined;
    }

    private applyInitialState(memberListVersion: number, memberInfos: MemberInfo[]): Promise<void> {
        const snapshot = this.createSnapshot(memberListVersion, memberInfos);
        this.memberListSnapshot = snapshot;
        this.logger.info('ClusterService', this.membersString(snapshot));
        const members = snapshot.memberList;
        const event = new InitialMembershipEvent(members);
        this.listeners.forEach((listener) => {
            if (this.isInitialMembershipListener(listener)) {
                listener.init(event);
            }
        });
        const addressProvider =
            this.clusterFailoverService.current().addressProvider;
        return this.translateToAddressProvider.refresh(addressProvider, memberInfos);
    }

    private detectMembershipEvents(
        prevMembers: MemberImpl[],
        currentMembers: MemberImpl[],
        connectionRegistry: ConnectionRegistry
    ): MembershipEvent[] {
        const newMembers = new Array<MemberImpl>();

        const deadMembers = new Map<string, MemberImpl>();
        for (const member of prevMembers) {
            deadMembers.set(member.id(), member);
        }

        for (const member of currentMembers) {
            if (!deadMembers.delete(member.id())) {
                newMembers.push(member);
            }
        }

        const events = new Array<MembershipEvent>(deadMembers.size + newMembers.length);
        let index = 0;

        // removal events should be added before added events
        deadMembers.forEach((member) => {
            events[index++] = new MembershipEvent(member, MemberEvent.REMOVED, currentMembers);
            const connection: Connection = connectionRegistry.getConnection(member.uuid);
            if (connection != null) {
                connection.close(null, new TargetDisconnectedError('The client has closed the connection to this '
                    + 'member, after receiving a member left event from the cluster ' + connection));
            }
        });

        for (const member of newMembers) {
            events[index++] = new MembershipEvent(member, MemberEvent.ADDED, currentMembers);
        }

        if (events.length !== 0) {
            if (this.memberListSnapshot.members.size !== 0) {
                this.logger.info('ClusterService', this.membersString(this.memberListSnapshot));
            }
        }
        return events;
    }

    private createSnapshot(memberListVersion: number, memberInfos: MemberInfo[]): MemberListSnapshot {
        const newMembers = new Map<string, MemberImpl>();
        const newMemberList = new Array<MemberImpl>(memberInfos.length);
        let index = 0;
        for (const memberInfo of memberInfos) {
            const member = new MemberImpl(memberInfo.address, memberInfo.uuid, memberInfo.attributes,
                memberInfo.liteMember, memberInfo.version, memberInfo.addressMap);
            newMembers.set(memberInfo.uuid.toString(), member);
            newMemberList[index++] = member;
        }
        return new MemberListSnapshot(memberListVersion, newMembers, newMemberList);
    }

    private membersString(snapshot: MemberListSnapshot): string {
        const members = snapshot.memberList;
        let logString = '\n\nMembers [' + members.length + '] {';
        for (const member of members) {
            logString += '\n\t' + member.toString();
        }
        logString += '\n}\n';
        return logString;
    }

    private getMemberList(): MemberImpl[] {
        return this.memberListSnapshot.memberList;
    }
}
