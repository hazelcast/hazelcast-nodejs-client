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

import HazelcastClient from '../HazelcastClient';
import {ClientConnectionManager} from '../network/ClientConnectionManager';
import {PartitionService} from '../PartitionService';
import {ClusterService} from '../invocation/ClusterService';
import {ILogger} from '../logging/ILogger';
import {ClientConnection} from '../network/ClientConnection';
import {ClientAddClusterViewListenerCodec} from '../codec/ClientAddClusterViewListenerCodec';
import {ClientMessage} from '../ClientMessage';
import {UUID} from '../core/UUID';
import {Invocation} from '../invocation/InvocationService';

/**
 * Adds cluster listener to one of the connections. If that connection is removed,
 * it registers connection to any other connection
 */
export class ClusterViewListenerService {

    private client: HazelcastClient;
    private connectionManager: ClientConnectionManager;
    private partitionService: PartitionService;
    private clusterService: ClusterService;
    private logger: ILogger;
    private listenerAddedConnection: ClientConnection;

    constructor(client: HazelcastClient) {
        this.client = client;
        this.logger = client.getLoggingService().getLogger();
        this.connectionManager = client.getConnectionManager();
        this.partitionService = client.getPartitionService();
        this.clusterService = client.getClusterService();
    }

    public start(): void {
        this.connectionManager.on('connectionAdded', this.connectionAdded.bind(this));
        this.connectionManager.on('connectionRemoved', this.connectionRemoved.bind(this));
    }

    private connectionAdded(connection: ClientConnection): void {
        this.tryRegister(connection);
    }

    private connectionRemoved(connection: ClientConnection): void {
        this.tryRegisterToRandomConnection(connection);
    }

    private tryRegister(connection: ClientConnection): void {
        if (this.listenerAddedConnection != null) {
            // already registering/registered to another connection
            return;
        }
        this.listenerAddedConnection = connection;

        const request = ClientAddClusterViewListenerCodec.encodeRequest();
        const handler = this.createClusterViewEventHandler(connection);
        const invocation = new Invocation(this.client, request);
        invocation.connection = connection;
        invocation.handler = handler;

        this.logger.trace('ClusterViewListenerService', `Register attempt of cluster view handler to ${connection}`);
        this.client.getInvocationService().invokeUrgent(invocation)
            .then(() => {
                this.logger.trace('ClusterViewListenerService', `Registered cluster view handler to ${connection}`);
            })
            .catch(() => {
                // listener needs to be re-registered
                this.tryRegisterToRandomConnection(connection);
            });
    }

    private tryRegisterToRandomConnection(oldConnection: ClientConnection): void {
        if (this.listenerAddedConnection !== oldConnection) {
            // somebody else already trying to re-register
            return;
        }
        this.listenerAddedConnection = null;
        const newConnection = this.connectionManager.getRandomConnection();
        if (newConnection != null) {
            this.tryRegister(newConnection);
        }
    }

    private createClusterViewEventHandler(connection: ClientConnection): (msg: ClientMessage) => void {
        return (clientMessage: ClientMessage) => {
            ClientAddClusterViewListenerCodec.handle(clientMessage,
                this.clusterService.handleMembersViewEvent.bind(this.clusterService),
                (version: number, partitions: Array<[UUID, number[]]>) => {
                    this.partitionService.handlePartitionViewEvent(connection, partitions, version);
                });
        };
    }

}
