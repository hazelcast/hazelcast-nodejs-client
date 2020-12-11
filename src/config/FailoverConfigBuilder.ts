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
/** @ignore *//** */

import * as assert from 'assert';
import {InvalidConfigurationError} from '../core';
import {
    assertPositiveNumber,
    tryGetArray,
    tryGetNumber
} from '../util/Util';
import {ConfigBuilder} from './ConfigBuilder';
import {ClientConfigImpl} from './Config';
import {ClientFailoverConfig, ClientFailoverConfigImpl} from './FailoverConfig';

/**
 * Responsible for user-defined config validation. Builds the effective config with necessary defaults.
 * @internal
 */
export class FailoverConfigBuilder {

    private originalConfig: ClientFailoverConfig;
    private effectiveConfig: ClientFailoverConfigImpl = new ClientFailoverConfigImpl();

    constructor(failoverConfig?: ClientFailoverConfig) {
        this.originalConfig = failoverConfig || {};
    }

    build(): ClientFailoverConfigImpl {
        try {
            this.handleConfig(this.originalConfig);
            this.validate();
            return this.effectiveConfig;
        } catch (err) {
            throw new InvalidConfigurationError('Config validation error: ' + err.message, err);
        }
    }

    private handleConfig(jsonObject: any): void {
        for (const key in jsonObject) {
            const value = jsonObject[key];
            if (key === 'tryCount') {
                const tryCount = tryGetNumber(value);
                assertPositiveNumber(tryCount, 'tryCount must be a positive integer.');
                this.effectiveConfig.tryCount = tryCount;
            } else if (key === 'clientConfigs') {
                const configs = tryGetArray(value);
                for (const rawConfig of configs) {
                    const builder = new ConfigBuilder(rawConfig);
                    const config = builder.build();
                    this.effectiveConfig.clientConfigs.push(config);
                }
            }
        }
    }

    private validate(): void {
        const clientConfigs = this.effectiveConfig.clientConfigs;
        assertPositiveNumber(clientConfigs.length, 'FailoverConfig must have at least one client config.');
        const main = clientConfigs[0];
        for (const alternative of clientConfigs.slice(1)) {
            this.validateAlternativeConfigs(main, alternative);
        }
    }

    private validateAlternativeConfigs(main: ClientConfigImpl,
                                       alternative: ClientConfigImpl): void {
        const allowedFields = [
            'clusterName',
            'customCredentials',
            'clusterMembers', // network.clusterMembers
            'ssl',            // network.ssl
            'hazelcastCloud', // network.hazelcastCloud
        ];
        const replacer = (key: string, value: any): any => {
            if (allowedFields.includes(key)) {
                return undefined;
            }
            return value;
        };
        const mainAsString = JSON.stringify(main, replacer);
        const alternativeAsString = JSON.stringify(alternative, replacer);

        assert(mainAsString === alternativeAsString, 'Alternative config with cluster name '
            + alternative.clusterName + ' must have the same config than the initial config '
            + 'with cluster name ' + main.clusterName + ' except for the following options: '
            + allowedFields);
    }
}
