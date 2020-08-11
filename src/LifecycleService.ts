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

import {EventEmitter} from 'events';
import HazelcastClient from './HazelcastClient';
import {ILogger} from './logging/ILogger';

/**
 * Lifecycle states.
 */
export enum LifecycleState {

    /**
     * Fired when the client is starting.
     */
    STARTING = 'STARTING',

    /**
     * Fired when the client's start is completed.
     */
    STARTED = 'STARTED',

    /**
     * Fired when the client is shutting down.
     */
    SHUTTING_DOWN = 'SHUTTING_DOWN',

    /**
     * Fired when the client's shut down is completed.
     */
    SHUTDOWN = 'SHUTDOWN',

    /**
     * Fired when the client is connected to the member.
     */
    CONNECTED = 'CONNECTED',

    /**
     * Fired when the client is disconnected from the member.
     */
    DISCONNECTED = 'DISCONNECTED',

    /**
     * Fired when the client is connected to a new cluster.
     */
    CHANGED_CLUSTER = 'CHANGED_CLUSTER',

}

const LIFECYCLE_EVENT_NAME = 'lifecycleEvent';

/**
 * Lifecycle service for Hazelcast clients. Allows to determine lifecycle
 * state of the client and shut it down.
 */
export interface LifecycleService {

    /**
     * Returns the active state of the client.
     * @returns {boolean}
     */
    isRunning(): boolean;

    /**
     * Shuts down the client.
     */
    shutdown(): void;

}

/** @internal */
export class LifecycleServiceImpl extends EventEmitter implements LifecycleService {

    private active: boolean;
    private client: HazelcastClient;
    private logger: ILogger;

    constructor(client: HazelcastClient) {
        super();
        this.setMaxListeners(0);
        this.client = client;
        this.logger = this.client.getLoggingService().getLogger();
        const listeners = client.getConfig().lifecycleListeners;
        listeners.forEach((listener) => {
            this.on(LIFECYCLE_EVENT_NAME, listener);
        });
    }

    /**
     * Causes LifecycleService to emit given event to all registered listeners.
     * @param state
     */
    emitLifecycleEvent(state: LifecycleState): void {
        this.logger.info('LifecycleService', 'HazelcastClient is ' + state);
        this.emit(LIFECYCLE_EVENT_NAME, state);
    }

    /**
     * Returns the active state of the client.
     * @returns {boolean}
     */
    isRunning(): boolean {
        return this.active;
    }

    start(): void {
        this.emitLifecycleEvent(LifecycleState.STARTING);
        this.active = true;
        this.emitLifecycleEvent(LifecycleState.STARTED);
    }

    shutdown(): void {
        if (!this.active) {
            return;
        }
        this.active = false;

        this.emitLifecycleEvent(LifecycleState.SHUTTING_DOWN);
        this.client.doShutdown();
        this.emitLifecycleEvent(LifecycleState.SHUTDOWN);
    }
}
