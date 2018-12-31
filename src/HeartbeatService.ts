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

import {ClientPingCodec} from './codec/ClientPingCodec';
import {ConnectionHeartbeatListener} from './core/ConnectionHeartbeatListener';
import HazelcastClient from './HazelcastClient';
import {ClientConnection} from './invocation/ClientConnection';
import {ILogger} from './logging/ILogger';

const PROPERTY_HEARTBEAT_INTERVAL: string = 'hazelcast.client.heartbeat.interval';
const PROPERTY_HEARTBEAT_TIMEOUT: string = 'hazelcast.client.heartbeat.timeout';

/**
 * Hearbeat Service
 */
export class Heartbeat {
    private client: HazelcastClient;
    private heartbeatTimeout: number;
    private heartbeatInterval: number;
    private listeners: ConnectionHeartbeatListener[] = [];
    private logger: ILogger;

    // Actually it is a NodeJS.Timer. Another typing file that comes with a module we use causes TSD to see
    // return type of setTimeout as number. Because of this we defined timer property as `any` type.
    private timer: any;

    constructor(client: HazelcastClient) {
        this.client = client;
        this.logger = this.client.getLoggingService().getLogger();
        this.heartbeatInterval = this.client.getConfig().properties[PROPERTY_HEARTBEAT_INTERVAL] as number;
        this.heartbeatTimeout = this.client.getConfig().properties[PROPERTY_HEARTBEAT_TIMEOUT] as number;
    }

    /**
     * Starts sending periodic heartbeat operations.
     */
    start(): void {
        this.timer = setTimeout(this.heartbeatFunction.bind(this), this.heartbeatInterval);
    }

    /**
     * Cancels scheduled heartbeat operations.
     */
    cancel(): void {
        clearTimeout(this.timer);
    }

    /**
     * Registers a heartbeat listener. Listener is invoked when a heartbeat related event occurs.
     * @param heartbeatListener
     */
    addListener(heartbeatListener: ConnectionHeartbeatListener): void {
        this.listeners.push(heartbeatListener);
    }

    private heartbeatFunction(): void {
        const estConnections = this.client.getConnectionManager().establishedConnections;
        for (const address in estConnections) {
            if (estConnections[address]) {
                const conn = estConnections[address];
                const now = Date.now();
                if (now - conn.getLastReadTimeMillis() > this.heartbeatTimeout) {
                    if (conn.isHeartbeating()) {
                        conn.setHeartbeating(false);
                        this.onHeartbeatStopped(conn);
                    }
                }
                if (now - conn.getLastWriteTimeMillis() > this.heartbeatInterval) {
                    const req = ClientPingCodec.encodeRequest();
                    this.client.getInvocationService().invokeOnConnection(conn, req)
                        .catch((error) => {
                            if (conn.isAlive()) {
                                this.logger.warn('HeartbeatService', 'Error receiving ping answer from the connection: '
                                    + conn + ' ' + error);
                            }
                        });
                } else {
                    if (!conn.isHeartbeating()) {
                        conn.setHeartbeating(true);
                        this.onHeartbeatRestored(conn);
                    }
                }
            }
        }
        this.timer = setTimeout(this.heartbeatFunction.bind(this), this.heartbeatInterval);
    }

    private onHeartbeatStopped(connection: ClientConnection): void {
        this.logger.warn('HeartbeatService', 'Heartbeat stopped on ' + connection.toString());
        this.listeners.forEach((listener) => {
            if (listener.hasOwnProperty('onHeartbeatStopped')) {
                setImmediate(listener.onHeartbeatStopped.bind(this), connection);
            }
        });
    }

    private onHeartbeatRestored(connection: ClientConnection): void {
        this.logger.warn('HeartbeatService', 'Heartbeat restored on ' + connection.toString());
        this.listeners.forEach((listener) => {
            if (listener.hasOwnProperty('onHeartbeatRestored')) {
                setImmediate(listener.onHeartbeatRestored.bind(this), connection);
            }
        });
    }

}
