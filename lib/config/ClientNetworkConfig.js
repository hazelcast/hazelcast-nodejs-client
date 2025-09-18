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
exports.ClientNetworkConfigImpl = void 0;
const ClientCloudConfig_1 = require("./ClientCloudConfig");
const SSLConfig_1 = require("./SSLConfig");
/** @internal */
class ClientNetworkConfigImpl {
    constructor() {
        this.clusterMembers = [];
        this.hazelcastCloud = new ClientCloudConfig_1.ClientCloudConfigImpl();
        this.connectionTimeout = 5000;
        this.redoOperation = false;
        this.smartRouting = true;
        this.ssl = new SSLConfig_1.SSLConfigImpl();
    }
}
exports.ClientNetworkConfigImpl = ClientNetworkConfigImpl;
//# sourceMappingURL=ClientNetworkConfig.js.map