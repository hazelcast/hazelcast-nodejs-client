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
exports.ClusterViewListenerService = void 0;
const ConnectionManager_1 = require("../network/ConnectionManager");
const ClientAddClusterViewListenerCodec_1 = require("../codec/ClientAddClusterViewListenerCodec");
const InvocationService_1 = require("../invocation/InvocationService");
/**
 * Adds cluster listener to one of the connections. If that connection is removed,
 * it registers connection to any other connection.
 * @internal
 */
class ClusterViewListenerService {
    constructor(logger, connectionManager, partitionService, clusterService, invocationService) {
        this.logger = logger;
        this.connectionManager = connectionManager;
        this.partitionService = partitionService;
        this.clusterService = clusterService;
        this.invocationService = invocationService;
    }
    start() {
        this.connectionManager.on(ConnectionManager_1.CONNECTION_ADDED_EVENT_NAME, this.connectionAdded.bind(this));
        this.connectionManager.on(ConnectionManager_1.CONNECTION_REMOVED_EVENT_NAME, this.connectionRemoved.bind(this));
    }
    connectionAdded(connection) {
        this.tryRegister(connection);
    }
    connectionRemoved(connection) {
        this.tryRegisterToRandomConnection(connection);
    }
    tryRegister(connection) {
        if (this.listenerAddedConnection != null) {
            // already registering/registered to another connection
            return;
        }
        this.listenerAddedConnection = connection;
        const request = ClientAddClusterViewListenerCodec_1.ClientAddClusterViewListenerCodec.encodeRequest();
        const handler = this.createClusterViewEventHandler(connection);
        const invocation = new InvocationService_1.Invocation(this.invocationService, request);
        invocation.connection = connection;
        invocation.eventHandler = handler;
        this.clusterService.onClusterConnect();
        this.logger.trace('ClusterViewListenerService', `Register attempt of cluster view handler to ${connection}`);
        this.invocationService.invokeUrgent(invocation)
            .then(() => {
            this.logger.trace('ClusterViewListenerService', `Registered cluster view handler to ${connection}`);
        })
            .catch(() => {
            // listener needs to be re-registered
            this.tryRegisterToRandomConnection(connection);
        });
    }
    tryRegisterToRandomConnection(oldConnection) {
        if (this.listenerAddedConnection !== oldConnection) {
            // somebody else already trying to re-register
            return;
        }
        this.listenerAddedConnection = null;
        const newConnection = this.connectionManager.getConnectionRegistry().getRandomConnection();
        if (newConnection != null) {
            this.tryRegister(newConnection);
        }
    }
    createClusterViewEventHandler(connection) {
        return (clientMessage) => {
            ClientAddClusterViewListenerCodec_1.ClientAddClusterViewListenerCodec.handle(clientMessage, this.clusterService.handleMembersViewEvent.bind(this.clusterService, connection.getClusterUuid()), (version, partitions) => {
                this.partitionService.handlePartitionViewEvent(connection, partitions, version);
            });
        };
    }
}
exports.ClusterViewListenerService = ClusterViewListenerService;
//# sourceMappingURL=ClusterViewListenerService.js.map