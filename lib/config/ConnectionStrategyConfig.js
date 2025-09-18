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
exports.ConnectionStrategyConfigImpl = exports.ReconnectMode = void 0;
const ConnectionRetryConfig_1 = require("./ConnectionRetryConfig");
/**
 * Reconnect mode.
 */
var ReconnectMode;
(function (ReconnectMode) {
    /**
     * Prevent reconnect to cluster after a disconnect
     */
    ReconnectMode["OFF"] = "OFF";
    /**
     * Reconnect to cluster by blocking invocations
     */
    ReconnectMode["ON"] = "ON";
    /**
     * Reconnect to cluster without blocking invocations. Invocations will receive
     * {@link ClientOfflineError}
     */
    ReconnectMode["ASYNC"] = "ASYNC";
})(ReconnectMode = exports.ReconnectMode || (exports.ReconnectMode = {}));
/** @internal */
class ConnectionStrategyConfigImpl {
    constructor() {
        this.asyncStart = false;
        this.reconnectMode = ReconnectMode.ON;
        this.connectionRetry = new ConnectionRetryConfig_1.ConnectionRetryConfigImpl();
    }
}
exports.ConnectionStrategyConfigImpl = ConnectionStrategyConfigImpl;
//# sourceMappingURL=ConnectionStrategyConfig.js.map