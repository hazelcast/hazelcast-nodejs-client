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

import {
    ConnectionManager,
    ConnectionRegistry,
    CONNECTION_ADDED_EVENT_NAME,
    CONNECTION_REMOVED_EVENT_NAME
} from '../network/ConnectionManager';
import {PartitionServiceImpl} from '../PartitionService';
import {ClusterService} from '../invocation/ClusterService';
import {ILogger} from '../logging/ILogger';
import {Connection} from '../network/Connection';
import {ClientAddClusterViewListenerCodec} from '../codec/ClientAddClusterViewListenerCodec';
import {ClientMessage} from '../protocol/ClientMessage';
import {UUID} from '../core/UUID';
import {Invocation, InvocationService} from '../invocation/InvocationService';

/**
 * Adds cluster listener to one of the connections. If that connection is removed,
 * it registers connection to any other connection.
 * @internal
 */
export class ClusterViewListenerService {

    private listenerAddedConnection: Connection;

    constructor(
        private readonly logger: ILogger,
        private readonly connectionManager: ConnectionManager,
        private readonly partitionService: PartitionServiceImpl,
        private readonly clusterService: ClusterService,
        private readonly invocationService: InvocationService,
        private readonly connectionRegistry: ConnectionRegistry
    ) {}

    public start(): void {
        this.connectionManager.on(CONNECTION_ADDED_EVENT_NAME, this.connectionAdded.bind(this));
        this.connectionManager.on(CONNECTION_REMOVED_EVENT_NAME, this.connectionRemoved.bind(this));
    }

    private connectionAdded(connection: Connection): void {
        this.tryRegister(connection);
    }

    private connectionRemoved(connection: Connection): void {
        this.tryRegisterToRandomConnection(connection);
    }

    private tryRegister(connection: Connection): void {
        if (this.listenerAddedConnection != null) {
            // already registering/registered to another connection
            return;
        }
        this.listenerAddedConnection = connection;

        const request = ClientAddClusterViewListenerCodec.encodeRequest();
        const handler = this.createClusterViewEventHandler(connection);
        const invocation = new Invocation(this.invocationService, request);
        invocation.connection = connection;
        invocation.handler = handler;

        this.logger.trace('ClusterViewListenerService', `Register attempt of cluster view handler to ${connection}`);
        this.clusterService.clearMemberListVersion();
        this.invocationService.invokeUrgent(invocation)
            .then(() => {
                this.logger.trace('ClusterViewListenerService', `Registered cluster view handler to ${connection}`);
            })
            .catch(() => {
                // listener needs to be re-registered
                this.tryRegisterToRandomConnection(connection);
            });
    }

    private tryRegisterToRandomConnection(oldConnection: Connection): void {
        if (this.listenerAddedConnection !== oldConnection) {
            // somebody else already trying to re-register
            return;
        }
        this.listenerAddedConnection = null;
        const newConnection = this.connectionRegistry.getRandomConnection();
        if (newConnection != null) {
            this.tryRegister(newConnection);
        }
    }

    private createClusterViewEventHandler(connection: Connection): (msg: ClientMessage) => void {
        return (clientMessage: ClientMessage): void => {
            ClientAddClusterViewListenerCodec.handle(clientMessage,
                this.clusterService.handleMembersViewEvent.bind(this.clusterService, this.connectionRegistry),
                (version: number, partitions: Array<[UUID, number[]]>) => {
                    this.partitionService.handlePartitionViewEvent(connection, partitions, version);
                });
        };
    }
}
