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
import Address = require('../Address');
import ClientMessage = require('../ClientMessage');
import {IllegalStateError} from '../HazelcastError';
import * as assert from 'assert';
import {MemberSelector} from '../core/MemberSelector';

const MEMBER_ADDED = 1;
const MEMBER_REMOVED = 2;

const EMIT_MEMBER_ADDED = 'memberAdded';
const EMIT_MEMBER_REMOVED = 'memberRemoved';
const EMIT_ATTRIBUTE_CHANGE = 'memberAttributeChange';
const ATTRIBUTE_CHANGE: {[key: string]: string} = {
    1: 'put',
    2: 'remove'
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
        if (this.members.length > 0) {
            this.knownAddresses = new Array<Address>();
            this.members.forEach((member: Member) => {
                this.knownAddresses.push(member.address);
            });
        } else {
            this.knownAddresses = this.client.getConfig().networkConfig.addresses;
        }

        var attemptLimit = this.client.getConfig().networkConfig.connectionAttemptLimit;
        var attemptPeriod = this.client.getConfig().networkConfig.connectionAttemptPeriod;
        return this.tryAddresses(0, attemptLimit, attemptPeriod);
    }

    /**
     * Returns the list of members in the cluster.
     * @returns
     */
    getMembers(selector?: MemberSelector) {
        if (selector === undefined) {
            return this.members;
        } else {
            let members: Member[] = [];
            this.members.forEach(function (member) {
                if (selector.select(member)) {
                    members.push(member);
                }
            });
            return members;
        }
    }

    /**
     * Returns the number of nodes in cluster.
     * @returns {number}
     */
    getSize() {
        return this.members.length;
    }

    /**
     * Returns information about this client.
     * @returns {ClientInfo}
     */
    getClientInfo(): ClientInfo {
        var info = new ClientInfo();
        info.uuid = this.uuid;
        info.localAddress = this.getOwnerConnection().getLocalAddress();
        return info;
    }

    private initHeartbeatListener() {
        this.client.getHeartbeat().addListener({
            onHeartbeatStopped: this.onHeartbeatStopped.bind(this)
        });
    }

    private initConnectionListener() {
        this.client.getConnectionManager().on('connectionClosed', this.onConnectionClosed.bind(this));
    }

    private onConnectionClosed(connection: ClientConnection) {
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

    private tryAddresses(index: number, attemptLimit: number, attemptPeriod: number): Promise<void> {
        if (this.knownAddresses.length <= index) {
            attemptLimit = attemptLimit - 1;
            if (attemptLimit === 0) {
                let error = new IllegalStateError('Unable to connect to any of the following addresses: ' +
                    this.knownAddresses.map((element: Address) => {
                        return element.toString();
                    }).join(', '));
                return Promise.reject(error);
            } else {
                let deferred = Promise.defer<void>();
                setTimeout(
                    () => {
                        this.tryAddresses(0, attemptLimit, attemptPeriod).then(() => {
                            deferred.resolve();
                        }).catch((e) => {
                            deferred.reject(e);
                        });
                    },
                    attemptPeriod
                );
                return deferred.promise;
            }
        } else {
            var currentAddress = this.knownAddresses[index];
            return this.client.getConnectionManager().getOrConnect(currentAddress, true).then((connection: ClientConnection) => {
                if (connection == null) {
                    throw new Error('Could not connect to ' + currentAddress.toString());
                }
                connection.setAuthneticatedAsOwner(true);
                this.ownerConnection = connection;
                return this.initMemberShipListener();
            }).catch((e) => {
                this.logger.warn('ClusterService', e);
                return this.tryAddresses(index + 1, attemptLimit, attemptPeriod);
            });
        }
    }

    /**
     * Returns the connection associated with owner node of this client.
     * @returns {ClientConnection}
     */
    getOwnerConnection(): ClientConnection {
        return this.ownerConnection;
    }

    initMemberShipListener(): Promise<void> {
        var request = ClientAddMembershipListenerCodec.encodeRequest(false);

        var handler = (m: ClientMessage) => {
            var handleMember = this.handleMember.bind(this);
            var handleMemberList = this.handleMemberList.bind(this);
            var handleAttributeChange = this.handleMemberAttributeChange.bind(this);
            ClientAddMembershipListenerCodec.handle(m, handleMember, handleMemberList, handleAttributeChange, null);
        };
        return this.client.getInvocationService().invokeOnConnection(this.getOwnerConnection(), request, handler)
            .then((resp: ClientMessage) => {
                this.logger.trace('ClusterService', 'Registered listener with id '
                    + ClientAddMembershipListenerCodec.decodeResponse(resp).response);
            });
    }

    private handleMember(member: Member, eventType: number) {
        if (eventType === MEMBER_ADDED) {
            this.logger.info('ClusterService', member.toString() + ' added to cluster');
            this.memberAdded(member);
        } else if (eventType === MEMBER_REMOVED) {
            this.logger.info('ClusterService', member.toString() + ' removed from cluster');
            this.memberRemoved(member);
        }
        this.client.getPartitionService().refresh();
    }

    private handleMemberList(members: Member[]) {
        this.members = members;
        this.client.getPartitionService().refresh();
        this.logger.info('ClusterService', 'Members received.', this.members);
    }

    private handleMemberAttributeChange(uuid: string, key: string, operationType: number, value: string) {
        this.emit(EMIT_ATTRIBUTE_CHANGE, uuid, key, ATTRIBUTE_CHANGE[operationType], value);
    }

    private memberAdded(member: Member) {
        this.members.push(member);
        this.emit(EMIT_MEMBER_ADDED, member);
    }

    private memberRemoved(member: Member) {
        let memberIndex = this.members.findIndex(member.equals, member);
        let removedMemberList = this.members.splice(memberIndex, 1);
        assert(removedMemberList.length === 1);
        let removedMember = removedMemberList[0];
        this.client.getConnectionManager().destroyConnection(removedMember.address);
        this.emit(EMIT_MEMBER_REMOVED, removedMember);
    }
}
