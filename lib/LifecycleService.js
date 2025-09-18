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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifecycleServiceImpl = exports.LifecycleState = void 0;
const events_1 = require("events");
/**
 * Lifecycle states.
 */
var LifecycleState;
(function (LifecycleState) {
    /**
     * Fired when the client is starting.
     */
    LifecycleState["STARTING"] = "STARTING";
    /**
     * Fired when the client's start is completed.
     */
    LifecycleState["STARTED"] = "STARTED";
    /**
     * Fired when the client is shutting down.
     */
    LifecycleState["SHUTTING_DOWN"] = "SHUTTING_DOWN";
    /**
     * Fired when the client's shut down is completed.
     */
    LifecycleState["SHUTDOWN"] = "SHUTDOWN";
    /**
     * Fired when the client is connected to the member.
     */
    LifecycleState["CONNECTED"] = "CONNECTED";
    /**
     * Fired when the client is disconnected from the cluster.
     */
    LifecycleState["DISCONNECTED"] = "DISCONNECTED";
    /**
     * Fired when the client is connected to a new cluster.
     */
    LifecycleState["CHANGED_CLUSTER"] = "CHANGED_CLUSTER";
})(LifecycleState = exports.LifecycleState || (exports.LifecycleState = {}));
const LIFECYCLE_EVENT_NAME = 'lifecycleEvent';
/** @internal */
class LifecycleServiceImpl extends events_1.EventEmitter {
    constructor(lifecycleListeners, logger) {
        super();
        this.logger = logger;
        this.setMaxListeners(0);
        lifecycleListeners.forEach((listener) => {
            this.on(LIFECYCLE_EVENT_NAME, listener);
        });
    }
    /**
     * Causes LifecycleService to emit the given event to all registered listeners.
     * @param state
     */
    emitLifecycleEvent(state) {
        this.logger.info('LifecycleService', 'HazelcastClient is ' + state);
        this.emit(LIFECYCLE_EVENT_NAME, state);
    }
    /**
     * Returns the active state of the client.
     * @returns {boolean}
     */
    isRunning() {
        return this.active;
    }
    start() {
        this.emitLifecycleEvent(LifecycleState.STARTING);
        this.active = true;
        this.emitLifecycleEvent(LifecycleState.STARTED);
    }
    /**
     * Runs when client shutdown process started
     */
    onShutdownStart() {
        this.active = false;
        this.emitLifecycleEvent(LifecycleState.SHUTTING_DOWN);
    }
    /**
     * Runs when client has been shutdown
     */
    onShutdownFinished() {
        this.emitLifecycleEvent(LifecycleState.SHUTDOWN);
    }
}
exports.LifecycleServiceImpl = LifecycleServiceImpl;
//# sourceMappingURL=LifecycleService.js.map