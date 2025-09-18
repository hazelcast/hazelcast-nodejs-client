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
exports.ConnectionRegistryImpl = void 0;
const core_1 = require("../core");
const config_1 = require("../config");
const Util_1 = require("../util/Util");
const ConnectionManager_1 = require("./ConnectionManager");
const SQL_CONNECTION_RANDOM_ATTEMPTS = 10;
/**
 * @internal
 */
class ConnectionRegistryImpl {
    constructor(asyncStart, reconnectMode, smartRoutingEnabled, loadBalancer, clusterService) {
        this.asyncStart = asyncStart;
        this.reconnectMode = reconnectMode;
        this.smartRoutingEnabled = smartRoutingEnabled;
        this.loadBalancer = loadBalancer;
        this.clusterService = clusterService;
        this.activeConnections = new Map();
        this.clientState = ConnectionManager_1.ClientState.INITIAL;
    }
    getClientState() {
        return this.clientState;
    }
    isEmpty() {
        return this.activeConnections.size === 0;
    }
    getConnections() {
        return Array.from(this.activeConnections.values());
    }
    getConnection(uuid) {
        return this.activeConnections.get(uuid.toString());
    }
    getRandomConnection() {
        if (this.smartRoutingEnabled) {
            const member = this.loadBalancer.next();
            if (member != null) {
                const connection = this.getConnection(member.uuid);
                if (connection != null) {
                    return connection;
                }
            }
        }
        const iterator = this.activeConnections.values();
        const next = iterator.next();
        if (!next.done) {
            return next.value;
        }
        else {
            return null;
        }
    }
    getConnectionForSql() {
        if (this.smartRoutingEnabled) {
            // There might be a race - the chosen member might be just connected or disconnected - try a
            // couple of times, the memberOfLargerSameVersionGroup returns a random connection,
            // we might be lucky...
            for (let i = 0; i < SQL_CONNECTION_RANDOM_ATTEMPTS; i++) {
                const member = (0, Util_1.memberOfLargerSameVersionGroup)(this.clusterService.getMembers());
                if (member === null) {
                    break;
                }
                const connection = this.getConnection(member.uuid);
                if (connection !== undefined) {
                    return connection;
                }
            }
        }
        // Otherwise iterate over connections and return the first one that's not to a lite member
        let firstConnection = null;
        for (const entry of this.activeConnections) {
            const memberId = entry[0];
            const connection = entry[1];
            if (firstConnection === null) {
                firstConnection = connection;
            }
            const member = this.clusterService.getMember(memberId);
            if (member === undefined || member.liteMember) {
                continue;
            }
            return connection;
        }
        // Failed to get a connection to a data member
        return firstConnection;
    }
    forEachConnection(fn) {
        this.activeConnections.forEach(fn);
    }
    checkIfInvocationAllowed() {
        const state = this.clientState;
        if (state === ConnectionManager_1.ClientState.INITIALIZED_ON_CLUSTER && this.activeConnections.size > 0) {
            return null;
        }
        let error;
        if (state === ConnectionManager_1.ClientState.INITIAL) {
            if (this.asyncStart) {
                error = new core_1.ClientOfflineError();
            }
            else {
                error = new core_1.IOError('No connection found to cluster since the client is starting.');
            }
        }
        else if (this.reconnectMode === config_1.ReconnectMode.ASYNC) {
            error = new core_1.ClientOfflineError();
        }
        else {
            error = new core_1.IOError('No connection found to cluster.');
        }
        return error;
    }
    clientInitializedOnCluster() {
        return this.clientState === ConnectionManager_1.ClientState.INITIALIZED_ON_CLUSTER;
    }
    deleteConnection(uuid) {
        this.activeConnections.delete(uuid.toString());
    }
    /**
     * Adds or updates a client connection by uuid
     * @param uuid UUID to identify the connection
     * @param connection to set
     */
    setConnection(uuid, connection) {
        this.activeConnections.set(uuid.toString(), connection);
    }
    setClientState(clientState) {
        this.clientState = clientState;
    }
}
exports.ConnectionRegistryImpl = ConnectionRegistryImpl;
//# sourceMappingURL=ConnectionRegistry.js.map