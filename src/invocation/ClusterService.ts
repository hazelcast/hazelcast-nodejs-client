/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
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

import {ClientConnection} from './ClientConnection';
import * as Promise from 'bluebird';
import {ClientAddMembershipListenerCodec} from '../codec/ClientAddMembershipListenerCodec';
import {Member} from '../core/Member';
import {LoggingService} from '../logging/LoggingService';
import {EventEmitter} from 'events';
import {ClientInfo} from '../ClientInfo';
import HazelcastClient from '../HazelcastClient';
import {IllegalStateError} from '../HazelcastError';
import * as assert from 'assert';
import {MemberSelector} from '../core/MemberSelector';
import {AddressHelper} from '../Util';
import Address = require('../Address');
import ClientMessage = require('../ClientMessage');

const MEMBER_ADDED = 1;
const MEMBER_REMOVED = 2;

const EMIT_MEMBER_ADDED = 'memberAdded';
const EMIT_MEMBER_REMOVED = 'memberRemoved';
const EMIT_ATTRIBUTE_CHANGE = 'memberAttributeChange';
const ATTRIBUTE_CHANGE: { [key: string]: string } = {
    1: 'put',
    2: 'remove',
};

/**
 * Manages the relationship of this client with the cluster.
 */
export class ClusterService extends EventEmitter {

    /**
     * The unique identifier of the owner server node. This node is responsible for resource cleanup
     */
    public ownerUuid: string = null;

    /**
     * The unique identifier of this client instance. Assigned by owner node on authentication
     */
    public uuid: string = null;

    private knownAddresses: Address[] = [];
    private members: Member[] = [];

    private client: HazelcastClient;
    private ownerConnection: ClientConnection;
    private logger = LoggingService.getLoggingService();

    constructor(client: HazelcastClient) {
        super();
        this.client = client;
        this.members = [];
    }

    /**
     * Starts cluster service.
     * @returns
     */
    start(): Promise<void> {
        this.initHeartbeatListener();
        this.initConnectionListener();
        return this.connectToCluster();
    }

    /**
     * Connects to cluster. It uses the addresses provided in the configuration.
     * @returns
     */
    connectToCluster(): Promise<void> {
        return this.getPossibleMemberAddresses().then((res) => {
            this.knownAddresses = [];
            res.forEach((value) => {
                this.knownAddresses = this.knownAddresses.concat(AddressHelper.getSocketAddresses(value));
            });

            const attemptLimit = this.client.getConfig().networkConfig.connectionAttemptLimit;
            const attemptPeriod = this.client.getConfig().networkConfig.connectionAttemptPeriod;
            return this.tryConnectingToAddresses(0, attemptLimit, attemptPeriod);
        });
    }

    getPossibleMemberAddresses(): Promise<string[]> {
        const addresses: Set<string> = new Set();

        this.getMembers().forEach(function (member): void {
            addresses.add(member.address.toString());
        });

        let providerAddresses: Set<string> = new Set();
        const promises: Array<Promise<void>> = [];
        this.client.getConnectionManager().addressProviders.forEach(function (addressProvider): void {
            promises.push(addressProvider.loadAddresses().then((res) => {
                providerAddresses = new Set([...Array.from(providerAddresses), ...res]);
            }).catch((err) => {
                this.logger.warning('Error from AddressProvider: ' + addressProvider, err);
            }));
        });
        return Promise.all(promises).then(() => {
            return Array.from(new Set([...Array.from(addresses), ...Array.from(providerAddresses)]));
        });
    }

    /**
     * Returns the list of members in the cluster.
     * @returns
     */
    getMembers(selector?: MemberSelector): Member[] {
        if (selector === undefined) {
            return this.members;
        } else {
            const members: Member[] = [];
            this.members.forEach(function (member): void {
                if (selector.select(member)) {
                    members.push(member);
                }
            });
            return members;
        }
    }

    getMember(uuid: string): Member {
        for (const member of this.members) {
            if (member.uuid === uuid) {
                return member;
            }
        }
        return null;
    }

    /**
     * Returns the number of nodes in cluster.
     * @returns {number}
     */
    getSize(): number {
        return this.members.length;
    }

    /**
     * Returns information about this client.
     * @returns {ClientInfo}
     */
    getClientInfo(): ClientInfo {
        const info = new ClientInfo();
        info.uuid = this.uuid;
        info.localAddress = this.getOwnerConnection().getLocalAddress();
        return info;
    }

    /**
     * Returns the connection associated with owner node of this client.
     * @returns {ClientConnection}
     */
    getOwnerConnection(): ClientConnection {
        return this.ownerConnection;
    }

    initMemberShipListener(): Promise<void> {
        const request = ClientAddMembershipListenerCodec.encodeRequest(false);

        const handler = (m: ClientMessage) => {
            const handleMember = this.handleMember.bind(this);
            const handleMemberList = this.handleMemberList.bind(this);
            const handleAttributeChange = this.handleMemberAttributeChange.bind(this);
            ClientAddMembershipListenerCodec.handle(m, handleMember, handleMemberList, handleAttributeChange, null);
        };
        return this.client.getInvocationService().invokeOnConnection(this.getOwnerConnection(), request, handler)
            .then((resp: ClientMessage) => {
                this.logger.trace('ClusterService', 'Registered listener with id '
                    + ClientAddMembershipListenerCodec.decodeResponse(resp).response);
            });
    }

    private initHeartbeatListener(): void {
        this.client.getHeartbeat().addListener({
            onHeartbeatStopped: this.onHeartbeatStopped.bind(this),
        });
    }

    private initConnectionListener(): void {
        this.client.getConnectionManager().on('connectionClosed', this.onConnectionClosed.bind(this));
    }

    private onConnectionClosed(connection: ClientConnection): void {
        this.logger.warn('ClusterService', 'Connection closed to ' + connection.toString());
        if (connection.isAuthenticatedAsOwner()) {
            this.ownerConnection = null;
            this.connectToCluster().catch(this.client.shutdown.bind(this.client));
        }
    }

    private onHeartbeatStopped(connection: ClientConnection): void {
        this.logger.warn('ClusterService', connection.toString() + ' stopped heartbeating.');
        if (connection.isAuthenticatedAsOwner()) {
            this.client.getConnectionManager().destroyConnection(connection.getAddress());
        }
    }

    private tryConnectingToAddresses(index: number, remainingAttemptLimit: number,
                                     attemptPeriod: number, cause?: Error): Promise<void> {
        this.logger.debug('ClusterService', 'Trying to connect to addresses, remaining attempt limit: ' + remainingAttemptLimit
            + ', attempt period: ' + attemptPeriod);
        if (this.knownAddresses.length <= index) {
            remainingAttemptLimit = remainingAttemptLimit - 1;
            if (remainingAttemptLimit === 0) {
                const errorMessage = 'Unable to connect to any of the following addresses: ' +
                    this.knownAddresses.map((element: Address) => {
                        return element.toString();
                    }).join(', ');
                this.logger.debug('ClusterService', errorMessage);
                const error = new IllegalStateError(errorMessage, cause);
                return Promise.reject(error);
            } else {
                const deferred = Promise.defer<void>();
                setTimeout(
                    () => {
                        this.tryConnectingToAddresses(0, remainingAttemptLimit, attemptPeriod).then(() => {
                            deferred.resolve();
                        }).catch((e) => {
                            deferred.reject(e);
                        });
                    },
                    attemptPeriod,
                );
                return deferred.promise;
            }
        } else {
            const currentAddress = this.knownAddresses[index];
            return this.client.getConnectionManager().getOrConnect(currentAddress, true).then((connection: ClientConnection) => {
                connection.setAuthenticatedAsOwner(true);
                this.ownerConnection = connection;
                return this.initMemberShipListener();
            }).catch((e) => {
                this.logger.warn('ClusterService', e);
                return this.tryConnectingToAddresses(index + 1, remainingAttemptLimit, attemptPeriod, e);
            });
        }
    }

    private handleMember(member: Member, eventType: number): void {
        if (eventType === MEMBER_ADDED) {
            this.logger.info('ClusterService', member.toString() + ' added to cluster');
            this.memberAdded(member);
        } else if (eventType === MEMBER_REMOVED) {
            this.logger.info('ClusterService', member.toString() + ' removed from cluster');
            this.memberRemoved(member);
        }
        this.client.getPartitionService().refresh();
    }

    private handleMemberList(members: Member[]): void {
        this.members = members;
        this.client.getPartitionService().refresh();
        this.logger.info('ClusterService', 'Members received.', this.members);
    }

    private handleMemberAttributeChange(uuid: string, key: string, operationType: number, value: string): void {
        this.emit(EMIT_ATTRIBUTE_CHANGE, uuid, key, ATTRIBUTE_CHANGE[operationType], value);
    }

    private memberAdded(member: Member): void {
        this.members.push(member);
        this.emit(EMIT_MEMBER_ADDED, member);
    }

    private memberRemoved(member: Member): void {
        const memberIndex = this.members.findIndex(member.equals, member);
        if (memberIndex !== -1) {
            const removedMemberList = this.members.splice(memberIndex, 1);
            assert(removedMemberList.length === 1);
        }
        this.client.getConnectionManager().destroyConnection(member.address);
        this.emit(EMIT_MEMBER_REMOVED, member);
    }
}
