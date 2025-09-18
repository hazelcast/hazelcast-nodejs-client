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
exports.LoadBalancerConfigImpl = exports.LoadBalancerType = void 0;
/**
 * Defines {@link LoadBalancer} type used by the client.
 */
var LoadBalancerType;
(function (LoadBalancerType) {
    /**
     * This type of load balancer picks the next member randomly.
     */
    LoadBalancerType["RANDOM"] = "RANDOM";
    /**
     * This type of load balancer picks each cluster member in turn.
     */
    LoadBalancerType["ROUND_ROBIN"] = "ROUND_ROBIN";
})(LoadBalancerType = exports.LoadBalancerType || (exports.LoadBalancerType = {}));
/** @internal */
class LoadBalancerConfigImpl {
    constructor() {
        this.type = LoadBalancerType.ROUND_ROBIN;
        this.customLoadBalancer = null;
    }
}
exports.LoadBalancerConfigImpl = LoadBalancerConfigImpl;
//# sourceMappingURL=LoadBalancerConfig.js.map