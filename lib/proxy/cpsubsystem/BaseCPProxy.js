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
exports.BaseCPProxy = void 0;
const CPGroupDestroyCPObjectCodec_1 = require("../../codec/CPGroupDestroyCPObjectCodec");
const core_1 = require("../../core");
/**
 * Common super class for any CP Subsystem proxy.
 * @internal
 */
class BaseCPProxy {
    constructor(serviceName, groupId, proxyName, objectName, invocationService, serializationService) {
        this.serviceName = serviceName;
        this.groupId = groupId;
        this.proxyName = proxyName;
        this.objectName = objectName;
        this.invocationService = invocationService;
        this.serializationService = serializationService;
    }
    getPartitionKey() {
        throw new core_1.UnsupportedOperationError('This operation is not supported by CP Subsystem');
    }
    getName() {
        return this.proxyName;
    }
    getServiceName() {
        return this.serviceName;
    }
    getGroupId() {
        return this.groupId;
    }
    destroy() {
        return this.encodeInvokeOnRandomTarget(CPGroupDestroyCPObjectCodec_1.CPGroupDestroyCPObjectCodec, () => { }, this.groupId, this.serviceName, this.objectName);
    }
    toData(object) {
        return this.serializationService.toData(object);
    }
    toObject(data) {
        return this.serializationService.toObject(data);
    }
    // eslint-disable-next-line @typescript-eslint/ban-types
    registerSchema(schema, clazz) {
        return this.invocationService.registerSchema(schema, clazz);
    }
    /**
     * Encodes a request from a codec and invokes it on any node.
     * @param codec
     * @param handler
     * @param codecArguments
     * @returns Promise that resolves to the return value of `handler`
     */
    encodeInvokeOnRandomTarget(codec, handler, ...codecArguments) {
        const clientMessage = codec.encodeRequest(...codecArguments);
        return this.invocationService.invokeOnRandomTarget(clientMessage, handler);
    }
}
exports.BaseCPProxy = BaseCPProxy;
//# sourceMappingURL=BaseCPProxy.js.map