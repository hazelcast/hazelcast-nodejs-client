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
exports.PartitionSpecificProxy = void 0;
const BaseProxy_1 = require("./BaseProxy");
/** @internal */
class PartitionSpecificProxy extends BaseProxy_1.BaseProxy {
    constructor(serviceName, name, proxyManager, partitionService, invocationService, serializationService, listenerService, clusterService, connectionRegistry, schemaService) {
        super(serviceName, name, proxyManager, partitionService, invocationService, serializationService, listenerService, clusterService, connectionRegistry, schemaService);
        this.partitionId = this.partitionService.getPartitionId(this.getPartitionKey());
    }
    encodeInvoke(codec, handler, ...codecArguments) {
        return this.encodeInvokeOnPartition(codec, this.partitionId, handler, ...codecArguments);
    }
}
exports.PartitionSpecificProxy = PartitionSpecificProxy;
//# sourceMappingURL=PartitionSpecificProxy.js.map