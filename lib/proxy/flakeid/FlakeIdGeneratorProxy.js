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
exports.FlakeIdGeneratorProxy = void 0;
const FlakeIdGeneratorNewIdBatchCodec_1 = require("../../codec/FlakeIdGeneratorNewIdBatchCodec");
const BaseProxy_1 = require("../BaseProxy");
const AutoBatcher_1 = require("./AutoBatcher");
/** @internal */
class FlakeIdGeneratorProxy extends BaseProxy_1.BaseProxy {
    constructor(serviceName, name, clientConfig, proxyManager, partitionService, invocationService, serializationService, listenerService, clusterService, connectionRegistry, schemaService) {
        super(serviceName, name, proxyManager, partitionService, invocationService, serializationService, listenerService, clusterService, connectionRegistry, schemaService);
        this.config = clientConfig.getFlakeIdGeneratorConfig(name);
        this.autoBatcher = new AutoBatcher_1.AutoBatcher(() => {
            return this.encodeInvokeOnRandomTarget(FlakeIdGeneratorNewIdBatchCodec_1.FlakeIdGeneratorNewIdBatchCodec, (clientMessage) => {
                const response = FlakeIdGeneratorNewIdBatchCodec_1.FlakeIdGeneratorNewIdBatchCodec.decodeResponse(clientMessage);
                return new AutoBatcher_1.Batch(this.config.prefetchValidityMillis, response.base, response.increment, response.batchSize);
            }, this.config.prefetchCount);
        });
    }
    newId() {
        return this.autoBatcher.nextId();
    }
}
exports.FlakeIdGeneratorProxy = FlakeIdGeneratorProxy;
//# sourceMappingURL=FlakeIdGeneratorProxy.js.map