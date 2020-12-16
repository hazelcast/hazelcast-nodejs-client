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
/** @ignore *//** */

import {ClientPingCodec} from '../codec/ClientPingCodec';
import {HazelcastClient} from '../HazelcastClient';
import {ClientConnection} from './ClientConnection';
import {ILogger} from '../logging/ILogger';
import {ClientConnectionManager} from './ClientConnectionManager';
import {cancelRepetitionTask, scheduleWithRepetition, Task} from '../util/Util';
import {TargetDisconnectedError} from '../core';
import {Invocation} from '../invocation/InvocationService';

const PROPERTY_HEARTBEAT_INTERVAL = 'hazelcast.client.heartbeat.interval';
const PROPERTY_HEARTBEAT_TIMEOUT = 'hazelcast.client.heartbeat.timeout';

/**
 * HeartbeatManager manager used by connection manager.
 * @internal
 */
export class HeartbeatManager {

    private client: HazelcastClient;
    private connectionManager: ClientConnectionManager;
    private readonly heartbeatTimeout: number;
    private readonly heartbeatInterval: number;
    private logger: ILogger;
    private task: Task;

    constructor(client: HazelcastClient, connectionManager: ClientConnectionManager) {
        this.client = client;
        this.connectionManager = connectionManager;
        this.logger = this.client.getLoggingService().getLogger();
        this.heartbeatInterval = this.client.getConfig().properties[PROPERTY_HEARTBEAT_INTERVAL] as number;
        this.heartbeatTimeout = this.client.getConfig().properties[PROPERTY_HEARTBEAT_TIMEOUT] as number;
    }

    /**
     * Starts sending periodic heartbeat operations.
     */
    start(): void {
        this.task = scheduleWithRepetition(
            this.heartbeatFunction.bind(this), this.heartbeatInterval, this.heartbeatInterval);
    }

    /**
     * Cancels the periodic heartbeat operation.
     */
    shutdown(): void {
        cancelRepetitionTask(this.task);
    }

    /**
     * Returns the heartbeat timeout in milliseconds.
     */
    getHeartbeatTimeout(): number {
        return this.heartbeatTimeout;
    }

    private heartbeatFunction(): void {
        if (!this.connectionManager.isAlive()) {
            return;
        }

        const now = Date.now();
        const activeConnections = this.connectionManager.getActiveConnections();
        for (const connection of activeConnections) {
            this.checkConnection(now, connection);
        }
    }

    private checkConnection(now: number, connection: ClientConnection): void {
        if (!connection.isAlive()) {
            return;
        }

        if (now - connection.getLastReadTimeMillis() > this.heartbeatTimeout) {
            this.logger.warn('HeartbeatManager', `Heartbeat failed over connection: ${connection}`);
            connection.close(null, new TargetDisconnectedError(`Heartbeat timed out to connection ${connection}`));
            return;
        }

        if (now - connection.getLastWriteTimeMillis() > this.heartbeatInterval) {
            const request = ClientPingCodec.encodeRequest();
            const invocation = new Invocation(this.client, request);
            invocation.connection = connection;
            this.client.getInvocationService()
                .invokeUrgent(invocation)
                .catch(() => {
                    // No-op
                });
        }
    }
}
