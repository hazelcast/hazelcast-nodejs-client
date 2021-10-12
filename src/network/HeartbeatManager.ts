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

import {ClientPingCodec} from '../codec/ClientPingCodec';
import {Connection} from './Connection';
import {ILogger} from '../logging/ILogger';
import {ConnectionRegistry} from '../network/ConnectionRegistry';
import {cancelRepetitionTask, scheduleWithRepetition, Task} from '../util/Util';
import {TargetDisconnectedError} from '../core';
import {Invocation, InvocationService} from '../invocation/InvocationService';
import {Properties} from '../config';

const PROPERTY_HEARTBEAT_INTERVAL = 'hazelcast.client.heartbeat.interval';
const PROPERTY_HEARTBEAT_TIMEOUT = 'hazelcast.client.heartbeat.timeout';

/**
 * HeartbeatManager manager used by connection manager.
 * @internal
 */
export class HeartbeatManager {

    private readonly heartbeatTimeout: number;
    private readonly heartbeatInterval: number;
    private logger: ILogger;
    private task: Task;
    private readonly connectionRegistry: ConnectionRegistry;

    constructor(
        properties: Properties,
        logger: ILogger,
        connectionRegistry: ConnectionRegistry
    ) {
        this.connectionRegistry = connectionRegistry;
        this.logger = logger;
        this.heartbeatInterval = properties[PROPERTY_HEARTBEAT_INTERVAL] as number;
        this.heartbeatTimeout = properties[PROPERTY_HEARTBEAT_TIMEOUT] as number;
    }

    /**
     * Starts sending periodic heartbeat operations.
     */
    start(invocationService: InvocationService): void {
        this.task = scheduleWithRepetition(
            this.heartbeatFunction.bind(this, invocationService), this.heartbeatInterval, this.heartbeatInterval);
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

    private heartbeatFunction(invocationService: InvocationService): void {
        if (!this.connectionRegistry.isActive()) {
            return;
        }

        const now = Date.now();
        for (const connection of this.connectionRegistry.getConnections()) {
            this.checkConnection(now, connection, invocationService);
        }
    }

    private checkConnection(now: number, connection: Connection, invocationService: InvocationService): void {
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
            const invocation = new Invocation(invocationService, request);
            invocation.connection = connection;
            invocationService
                .invokeUrgent(invocation)
                .catch(() => {
                    // No-op
                });
        }
    }
}
