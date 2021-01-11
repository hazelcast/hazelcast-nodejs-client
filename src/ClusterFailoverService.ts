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

import {AddressProvider} from './connection/AddressProvider';
import {ClientConfigImpl} from './config';
import {IllegalStateError} from './core';
import {LifecycleService} from './LifecycleService';
import {HazelcastCloudAddressProvider} from './discovery/HazelcastCloudAddressProvider';
import {DefaultAddressProvider} from './connection/DefaultAddressProvider';
import {HazelcastCloudDiscovery} from './discovery/HazelcastCloudDiscovery';
import {LoggingService} from './logging/LoggingService';

type TryNextFn = (nextCtx: CandidateClusterContext) => Promise<boolean>;

/**
 * Responsible for cluster failover state and attempts management.
 * @internal
 */
export class ClusterFailoverService {

    private readonly maxTryCount: number;
    private readonly candidateClusters: CandidateClusterContext[];
    private readonly lifecycleService: LifecycleService;
    private index = 0;

    constructor(maxTryCount: number,
                candidateClusters: CandidateClusterContext[],
                lifecycleService: LifecycleService) {
        this.maxTryCount = maxTryCount;
        this.candidateClusters = candidateClusters.slice();
        this.lifecycleService = lifecycleService;
    }

    tryNextCluster(fn: TryNextFn): Promise<boolean> {
        return this.doTryNextCluster(0, fn);
    }

    private doTryNextCluster(tryCount: number, fn: TryNextFn): Promise<boolean> {
        if (!this.lifecycleService.isRunning() || tryCount >= this.maxTryCount) {
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

    current(): CandidateClusterContext {
        return this.candidateClusters[this.index % this.candidateClusters.length];
    }

    private next(): CandidateClusterContext {
        return this.candidateClusters[++this.index % this.candidateClusters.length];
    }
}

/**
 * Carries the information that is specific to one cluster.
 * @internal
 */
export class CandidateClusterContext {

    readonly clusterName: string;
    readonly addressProvider: AddressProvider;
    readonly customCredentials: any;

    constructor(clusterName: string,
                addressProvider: AddressProvider,
                customCredentials: any) {
        this.clusterName = clusterName;
        this.addressProvider = addressProvider;
        this.customCredentials = customCredentials;
    }
}

/** @internal */
export class ClusterFailoverServiceBuilder {

    private readonly maxTryCount: number;
    private readonly clientConfigs: ClientConfigImpl[];
    private readonly lifecycleService: LifecycleService;
    private readonly loggingService: LoggingService;

    constructor(maxTryCount: number,
                clientConfigs: ClientConfigImpl[],
                lifecycleService: LifecycleService,
                loggingService: LoggingService) {
        this.maxTryCount = maxTryCount;
        this.clientConfigs = clientConfigs.slice();
        this.lifecycleService = lifecycleService;
        this.loggingService = loggingService;
    }

    build(): ClusterFailoverService {
        const contexts: CandidateClusterContext[] = [];
        for (const config of this.clientConfigs) {
            const addressProvider = this.createAddressProvider(config);
            const context = new CandidateClusterContext(
                config.clusterName, addressProvider, config.customCredentials);
            contexts.push(context);
        }
        return new ClusterFailoverService(this.maxTryCount, contexts, this.lifecycleService);
    }

    private createAddressProvider(config: ClientConfigImpl): AddressProvider {
        const networkConfig = config.network;

        const addressListProvided = networkConfig.clusterMembers.length !== 0;
        const hazelcastCloudToken = networkConfig.hazelcastCloud.discoveryToken;
        if (addressListProvided && hazelcastCloudToken != null) {
            throw new IllegalStateError('Only one discovery method can be enabled at a time. '
                + 'Cluster members given explicitly: ' + addressListProvided
                + ', Hazelcast Cloud enabled.');
        }

        const cloudAddressProvider = this.initCloudAddressProvider(config);
        if (cloudAddressProvider != null) {
            return cloudAddressProvider;
        }

        return new DefaultAddressProvider(networkConfig);
    }

    private initCloudAddressProvider(config: ClientConfigImpl): HazelcastCloudAddressProvider {
        const cloudConfig = config.network.hazelcastCloud;
        const discoveryToken = cloudConfig.discoveryToken;
        if (discoveryToken != null) {
            const urlEndpoint = HazelcastCloudDiscovery.createUrlEndpoint(config.properties, discoveryToken);
            return new HazelcastCloudAddressProvider(
                urlEndpoint, this.getConnectionTimeoutMillis(config), this.loggingService.getLogger());
        }
        return null;
    }

    private getConnectionTimeoutMillis(config: ClientConfigImpl): number {
        const networkConfig = config.network;
        const connTimeout = networkConfig.connectionTimeout;
        return connTimeout === 0 ? Number.MAX_SAFE_INTEGER : connTimeout;
    }
}
