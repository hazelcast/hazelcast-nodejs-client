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

import {ClientConnection} from '../network/ClientConnection';
import * as Promise from 'bluebird';
import {Member} from '../core/Member';
import {ClientInfo} from '../ClientInfo';
import HazelcastClient from '../HazelcastClient';
import {IllegalStateError, TargetDisconnectedError} from '../HazelcastError';
import {MemberSelector} from '../core/MemberSelector';
import {assertNotNull, DeferredPromise} from '../Util';
import {MembershipListener} from '../core/MembershipListener';
import {MembershipEventImpl, MemberEvent} from '../core/MembershipEvent';
import {UuidUtil} from '../util/UuidUtil';
import {ILogger} from '../logging/ILogger';
import {UUID} from '../core/UUID';
import {ClientConnectionManager} from '../network/ClientConnectionManager';
import {InitialMembershipListener} from '../core/InitialMembershipListener';
import {InitialMembershipEvent} from '../core/InitialMembershipEvent';
import {MemberInfo} from '../core/MemberInfo';
import {Cluster} from '../core/Cluster';

class MemberListSnapshot {
    version: number;
    readonly members: Map<string, Member>;
    readonly memberList: Member[];

    constructor(version: number, members: Map<string, Member>, memberList: Member[]) {
        this.version = version;
        this.members = members;
        this.memberList = memberList;
    }
}

const EMPTY_SNAPSHOT = new MemberListSnapshot(-1, new Map<string, Member>(), []);
const INITIAL_MEMBERS_TIMEOUT_IN_MILLIS = 120 * 1000; // 120 seconds

/**
 * Manages the relationship of this client with the cluster.
 */
export class ClusterService implements Cluster {
    private client: HazelcastClient;
    private memberListSnapshot: MemberListSnapshot = EMPTY_SNAPSHOT;
    private listeners: Map<string, MembershipListener> = new Map();
    private logger: ILogger;
    private initialListFetched = DeferredPromise<void>();
    private connectionManager: ClientConnectionManager;
    private readonly labels: Set<string>;

    constructor(client: HazelcastClient) {
        this.client = client;
        this.labels = new Set(client.getConfig().clientLabels);
        this.logger = client.getLoggingService().getLogger();
        this.connectionManager = client.getConnectionManager();
    }

    /**
     * Gets the member with the given UUID.
     *
     * @param uuid The UUID of the member.
     * @return The member that was found, or undefined if not found.
     */
    public getMember(uuid: UUID): Member {
        assertNotNull(uuid);
        return this.memberListSnapshot.members.get(uuid.toString());
    }

    /**
     * Returns an array of the members that satisfy the given {@link MemberSelector}.
     *
     * @param selector {@link MemberSelector} instance to filter members to return
     * @return members that satisfy the given selector.
     */
    public getMembers(selector?: MemberSelector): Member[] {
        const members = this.getMemberList();
        if (selector == null) {
            return members;
        }

        const selectedMembers: Member[] = [];
        members.forEach((member) => {
            if (selector.select(member)) {
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
    public getSize(): number {
        return this.memberListSnapshot.members.size;
    }

    /**
     * @return The {@link ClientInfo} instance representing the local client.
     */
    public getLocalClient(): ClientInfo {
        const connectionManager = this.client.getConnectionManager();
        const connection: ClientConnection = connectionManager.getRandomConnection();
        const localAddress = connection != null ? connection.getLocalAddress() : null;
        const info = new ClientInfo();
        info.uuid = connectionManager.getClientUuid();
        info.localAddress = localAddress;
        info.labels = this.labels;
        info.name = this.client.getName();
        return info;
    }

    /**
     * @param listener The listener to be registered.
     * @return The registration ID
     */
    public addMembershipListener(listener: MembershipListener): UUID {
        assertNotNull(listener);

        const registrationId = UuidUtil.generate();
        this.listeners.set(registrationId.toString(), listener);

        if (this.isInitialMembershipListener(listener)) {
            const members = this.getMemberList();
            // if members are empty,it means initial event did not arrive yet
            // it will be redirected to listeners when it arrives see #handleInitialMembershipEvent
            if (members.length !== 0) {
                const event = new InitialMembershipEvent(members);
                listener.init(event);
            }
        }
        return registrationId;
    }

    /**
     * @param registrationId The registrationId of the listener to be removed.
     * @return true if successfully removed, false otherwise.
     */
    public removeMembershipListener(registrationId: UUID): boolean {
        assertNotNull(registrationId);
        return this.listeners.delete(registrationId.toString());
    }

    public start(configuredListeners: MembershipListener[]): void {
        for (const listener of configuredListeners) {
            this.addMembershipListener(listener);
        }
    }

    public waitInitialMemberListFetched(): Promise<void> {
        return this.initialListFetched.promise
            .timeout(INITIAL_MEMBERS_TIMEOUT_IN_MILLIS)
            .catch((error) => {
                return Promise.reject(new IllegalStateError('Could not get initial member list from the cluster!', error));
            });
    }

    public clearMemberListVersion(): void {
        this.logger.trace('ClusterService', 'Resetting the member list version');
        if (this.memberListSnapshot !== EMPTY_SNAPSHOT) {
            this.memberListSnapshot.version = 0;
        }
    }

    public reset(): void {
        this.logger.trace('ClusterService', 'Resetting the cluster snapshot');
        this.initialListFetched = DeferredPromise<void>();
        this.memberListSnapshot = EMPTY_SNAPSHOT;
    }

    public handleMembersViewEvent(memberListVersion: number, memberInfos: MemberInfo[]): void {
        if (this.memberListSnapshot === EMPTY_SNAPSHOT) {
            this.applyInitialState(memberListVersion, memberInfos);
            this.initialListFetched.resolve();
            return;
        }

        if (memberListVersion >= this.memberListSnapshot.version) {
            const prevMembers = this.memberListSnapshot.memberList;
            const snapshot = this.createSnapshot(memberListVersion, memberInfos);
            this.memberListSnapshot = snapshot;
            const currentMembers = snapshot.memberList;
            const events = this.detectMembershipEvents(prevMembers, currentMembers);
            this.fireEvents(events);
        }
    }

    private fireEvents(events: MembershipEventImpl[]): void {
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

    private applyInitialState(memberListVersion: number, memberInfos: MemberInfo[]): void {
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
    }

    private detectMembershipEvents(prevMembers: Member[], currentMembers: Member[]): MembershipEventImpl[] {
        const newMembers = new Array<Member>();

        const deadMembers = new Map<string, Member>();
        for (const member of prevMembers) {
            deadMembers.set(member.id(), member);
        }

        for (const member of currentMembers) {
            if (!deadMembers.delete(member.id())) {
                newMembers.push(member);
            }
        }

        const events = new Array<MembershipEventImpl>(deadMembers.size + newMembers.length);
        let index = 0;

        // removal events should be added before added events
        deadMembers.forEach((member) => {
            events[index++] = new MembershipEventImpl(member, MemberEvent.REMOVED, currentMembers);
            const connection: ClientConnection = this.connectionManager.getConnection(member.uuid);
            if (connection != null) {
                connection.close(null, new TargetDisconnectedError('The client has closed the connection to this ' +
                    'member, after receiving a member left event from the cluster ' + connection));
            }
        });

        for (const member of newMembers) {
            events[index++] = new MembershipEventImpl(member, MemberEvent.ADDED, currentMembers);
        }

        if (events.length !== 0) {
            if (this.memberListSnapshot.members.size !== 0) {
                this.logger.info('ClusterService', this.membersString(this.memberListSnapshot));
            }
        }
        return events;
    }

    private createSnapshot(memberListVersion: number, memberInfos: MemberInfo[]): MemberListSnapshot {
        const newMembers = new Map<string, Member>();
        const newMemberList = new Array<Member>(memberInfos.length);
        let index = 0;
        for (const memberInfo of memberInfos) {
            const member = new Member(memberInfo.address, memberInfo.uuid, memberInfo.attributes, memberInfo.liteMember,
                memberInfo.version);
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

    private getMemberList(): Member[] {
        return this.memberListSnapshot.memberList;
    }

}
