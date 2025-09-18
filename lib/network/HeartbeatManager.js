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
exports.HeartbeatManager = void 0;
const ClientPingCodec_1 = require("../codec/ClientPingCodec");
const Util_1 = require("../util/Util");
const core_1 = require("../core");
const InvocationService_1 = require("../invocation/InvocationService");
const PROPERTY_HEARTBEAT_INTERVAL = 'hazelcast.client.heartbeat.interval';
const PROPERTY_HEARTBEAT_TIMEOUT = 'hazelcast.client.heartbeat.timeout';
/**
 * HeartbeatManager manager used by connection manager.
 * @internal
 */
class HeartbeatManager {
    constructor(properties, logger, connectionManager) {
        this.logger = logger;
        this.connectionManager = connectionManager;
        this.heartbeatInterval = properties[PROPERTY_HEARTBEAT_INTERVAL];
        this.heartbeatTimeout = properties[PROPERTY_HEARTBEAT_TIMEOUT];
    }
    /**
     * Starts sending periodic heartbeat operations.
     */
    start(invocationService) {
        this.task = (0, Util_1.scheduleWithRepetition)(this.heartbeatFunction.bind(this, invocationService), this.heartbeatInterval, this.heartbeatInterval);
    }
    /**
     * Cancels the periodic heartbeat operation.
     */
    shutdown() {
        (0, Util_1.cancelRepetitionTask)(this.task);
    }
    /**
     * Returns the heartbeat timeout in milliseconds.
     */
    getHeartbeatTimeout() {
        return this.heartbeatTimeout;
    }
    heartbeatFunction(invocationService) {
        if (!this.connectionManager.isActive()) {
            return;
        }
        const now = Date.now();
        for (const connection of this.connectionManager.getConnectionRegistry().getConnections()) {
            this.checkConnection(now, connection, invocationService);
        }
    }
    checkConnection(now, connection, invocationService) {
        if (!connection.isAlive()) {
            return;
        }
        if (now - connection.getLastReadTimeMillis() > this.heartbeatTimeout) {
            this.logger.warn('HeartbeatManager', `Heartbeat failed over connection: ${connection}`);
            connection.close(null, new core_1.TargetDisconnectedError(`Heartbeat timed out to connection ${connection}`));
            return;
        }
        if (now - connection.getLastWriteTimeMillis() > this.heartbeatInterval) {
            const request = ClientPingCodec_1.ClientPingCodec.encodeRequest();
            const invocation = new InvocationService_1.Invocation(invocationService, request);
            invocation.connection = connection;
            invocationService
                .invokeUrgent(invocation)
                .catch(() => {
                // No-op
            });
        }
    }
}
exports.HeartbeatManager = HeartbeatManager;
//# sourceMappingURL=HeartbeatManager.js.map