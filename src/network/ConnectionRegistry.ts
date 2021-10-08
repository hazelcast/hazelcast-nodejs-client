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

import {ClientOfflineError, IOError, LoadBalancer, UUID} from '../core';
import {Connection} from './Connection';
import {Properties, ReconnectMode} from '../config';
import {ClusterService} from '../invocation/ClusterService';
import {memberOfLargerSameVersionGroup} from '../util/Util';
import {ClientState} from './ConnectionManager';

const SQL_CONNECTION_RANDOM_ATTEMPTS = 10;

/**
 * Connection registry keeps active connections and the client's connection state.
 * @internal
 */
export interface ConnectionRegistry {
    /**
     * Returns if the registry active
     * @return Return true if the registry is active, false otherwise
     */
    isActive(): boolean;

    /**
     * Returns connection by UUID
     * @param uuid UUID that identifies the connection
     * @return Connection if there is a connection with the UUID, undefined otherwise
     */
    getConnection(uuid: UUID): Connection | undefined;

    /**
     * Returns all active connections in the registry
     * @return Array of Connection objects
     */
    getConnections(): Connection[];

    /**
     * Returns a random connection from active connections
     * @return Connection if there is at least one connection, otherwise null
     */
    getRandomConnection(): Connection | null;

    /**
     * Returns a connection for executing SQL.
     *
     * @throws IllegalStateError If there are more than 2 distinct member versions found
     * @return
     * * A random connection to a data member from the larger same-version group
     * * If there's no such connection, return connection to a random data member
     * * If there's no such connection, return any random connection
     * * If there are no connections, null is returned
     */
    getConnectionForSql(): Connection | null;

    /**
     * Returns if invocation allowed. Invocation is allowed only if the client's state is {@link INITIALIZED_ON_CLUSTER}
     * and there is at least one active connection.
     * @return Error if invocation is not allowed, null otherwise
     */
    checkIfInvocationAllowed(): Error | null;
}

/**
 * @internal
 */
export class ConnectionRegistryImpl implements ConnectionRegistry {

    private active = false;
    private readonly activeConnections = new Map<string, Connection>();
    private clientState = ClientState.INITIAL;

    constructor(
        private readonly asyncStart: boolean,
        private readonly reconnectMode: ReconnectMode,
        private readonly smartRoutingEnabled: boolean,
        private readonly properties: Properties,
        private readonly loadBalancer: LoadBalancer,
        private readonly clusterService: ClusterService
    ) {
    }

    isActive(): boolean {
        return this.active;
    }

    getClientState(): ClientState {
        return this.clientState;
    }

    isEmpty(): boolean {
        return this.activeConnections.size === 0;
    }

    getConnections(): Connection[] {
        return Array.from(this.activeConnections.values());
    }

    getConnection(uuid: UUID): Connection | undefined {
        return this.activeConnections.get(uuid.toString());
    }

    getRandomConnection(): Connection | null {
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
        } else {
            return null;
        }
    }

    getConnectionForSql(): Connection | null {
        if (this.smartRoutingEnabled) {
            // There might be a race - the chosen member might be just connected or disconnected - try a
            // couple of times, the memberOfLargerSameVersionGroup returns a random connection,
            // we might be lucky...
            for (let i = 0; i < SQL_CONNECTION_RANDOM_ATTEMPTS; i++) {
                const member = memberOfLargerSameVersionGroup(this.clusterService.getMembers());

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
        let firstConnection: Connection | null = null;
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

    forEachConnection(fn: (conn: Connection) => void): void {
        this.activeConnections.forEach(fn);
    }

    checkIfInvocationAllowed(): Error | null {
        const state = this.clientState;
        if (state === ClientState.INITIALIZED_ON_CLUSTER && this.activeConnections.size > 0) {
            return null;
        }

        let error: Error;
        if (state === ClientState.INITIAL) {
            if (this.asyncStart) {
                error = new ClientOfflineError();
            } else {
                error = new IOError('No connection found to cluster since the client is starting.');
            }
        } else if (this.reconnectMode === ReconnectMode.ASYNC) {
            error = new ClientOfflineError();
        } else {
            error = new IOError('No connection found to cluster.');
        }
        return error;
    }

    deleteConnection(uuid: UUID): void {
        this.activeConnections.delete(uuid.toString());
    }

    /**
     * Adds or updates a client connection by uuid
     * @param uuid UUID to identify the connection
     * @param connection to set
     */
    setConnection(uuid: UUID, connection: Connection): void {
        this.activeConnections.set(uuid.toString(), connection);
    }

    setClientState(clientState: ClientState): void {
        this.clientState = clientState;
    }

    activate(): void {
        this.active = true;
    }

    deactivate(): void {
        this.active = false;
    }
}
