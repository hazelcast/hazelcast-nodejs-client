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
exports.ClusterFailoverServiceBuilder = exports.CandidateClusterContext = exports.ClusterFailoverService = void 0;
const core_1 = require("./core");
const HazelcastCloudAddressProvider_1 = require("./discovery/HazelcastCloudAddressProvider");
const DefaultAddressProvider_1 = require("./connection/DefaultAddressProvider");
const HazelcastCloudDiscovery_1 = require("./discovery/HazelcastCloudDiscovery");
/**
 * Responsible for cluster failover state and attempts management.
 * @internal
 */
class ClusterFailoverService {
    constructor(maxTryCount, candidateClusters, lifecycleService) {
        this.index = 0;
        this.maxTryCount = maxTryCount;
        this.candidateClusters = candidateClusters.slice();
        this.lifecycleService = lifecycleService;
    }
    tryNextCluster(fn) {
        return this.doTryNextCluster(0, fn);
    }
    doTryNextCluster(tryCount, fn) {
        if (!this.lifecycleService.isRunning() || tryCount >= (this.maxTryCount * this.candidateClusters.length)) {
            return Promise.resolve(false);
        }
        return fn(this.next())
            .then((result) => {
            if (result) {
                return true;
            }
            return this.doTryNextCluster(tryCount + 1, fn);
        });
    }
    current() {
        return this.candidateClusters[this.index % this.candidateClusters.length];
    }
    next() {
        return this.candidateClusters[++this.index % this.candidateClusters.length];
    }
}
exports.ClusterFailoverService = ClusterFailoverService;
/**
 * Carries the information that is specific to one cluster.
 * @internal
 */
class CandidateClusterContext {
    constructor(clusterName, addressProvider, customCredentials, securityConfig) {
        this.clusterName = clusterName;
        this.addressProvider = addressProvider;
        this.customCredentials = customCredentials;
        this.securityConfig = securityConfig;
    }
}
exports.CandidateClusterContext = CandidateClusterContext;
/** @internal */
class ClusterFailoverServiceBuilder {
    constructor(maxTryCount, clientConfigs, lifecycleService, loggingService) {
        this.maxTryCount = maxTryCount;
        this.clientConfigs = clientConfigs.slice();
        this.lifecycleService = lifecycleService;
        this.loggingService = loggingService;
    }
    build() {
        const contexts = [];
        for (const config of this.clientConfigs) {
            const addressProvider = this.createAddressProvider(config);
            const context = new CandidateClusterContext(config.clusterName, addressProvider, config.customCredentials, config.security);
            contexts.push(context);
        }
        return new ClusterFailoverService(this.maxTryCount, contexts, this.lifecycleService);
    }
    createAddressProvider(config) {
        const networkConfig = config.network;
        const addressListProvided = networkConfig.clusterMembers.length !== 0;
        const hazelcastCloudToken = networkConfig.hazelcastCloud.discoveryToken;
        if (addressListProvided && hazelcastCloudToken != null) {
            throw new core_1.IllegalStateError('Only one discovery method can be enabled at a time. '
                + 'Cluster members given explicitly: ' + addressListProvided
                + ', Hazelcast Cloud enabled.');
        }
        const cloudAddressProvider = this.initCloudAddressProvider(config);
        if (cloudAddressProvider != null) {
            return cloudAddressProvider;
        }
        return new DefaultAddressProvider_1.DefaultAddressProvider(networkConfig);
    }
    initCloudAddressProvider(config) {
        const cloudConfig = config.network.hazelcastCloud;
        const discoveryToken = cloudConfig.discoveryToken;
        if (discoveryToken != null) {
            const urlEndpoint = HazelcastCloudDiscovery_1.HazelcastCloudDiscovery.createUrlEndpoint(config.properties, discoveryToken);
            return new HazelcastCloudAddressProvider_1.HazelcastCloudAddressProvider(urlEndpoint, ClusterFailoverServiceBuilder.getConnectionTimeoutMillis(config), this.loggingService.getLogger());
        }
        return null;
    }
    static getConnectionTimeoutMillis(config) {
        const networkConfig = config.network;
        const connTimeout = networkConfig.connectionTimeout;
        return connTimeout === 0 ? Number.MAX_SAFE_INTEGER : connTimeout;
    }
}
exports.ClusterFailoverServiceBuilder = ClusterFailoverServiceBuilder;
//# sourceMappingURL=ClusterFailoverService.js.map