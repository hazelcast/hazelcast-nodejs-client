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
exports.FailoverConfigBuilder = void 0;
const assert = require("assert");
const util = require("util");
const core_1 = require("../core");
const Util_1 = require("../util/Util");
const ConfigBuilder_1 = require("./ConfigBuilder");
const FailoverConfig_1 = require("./FailoverConfig");
/**
 * Responsible for user-defined config validation. Builds the effective config with necessary defaults.
 * @internal
 */
class FailoverConfigBuilder {
    constructor(failoverConfig) {
        this.effectiveConfig = new FailoverConfig_1.ClientFailoverConfigImpl();
        this.originalConfig = failoverConfig || {};
    }
    build() {
        try {
            this.handleConfig(this.originalConfig);
            this.validate();
            return this.effectiveConfig;
        }
        catch (err) {
            throw new core_1.InvalidConfigurationError('Config validation error: ' + err.message, err);
        }
    }
    handleConfig(jsonObject) {
        for (const key in jsonObject) {
            const value = jsonObject[key];
            if (key === 'tryCount') {
                const tryCount = (0, Util_1.tryGetNumber)(value);
                (0, Util_1.assertNonNegativeNumber)(tryCount, 'tryCount must be a non-negative integer.');
                this.effectiveConfig.tryCount = tryCount;
            }
            else if (key === 'clientConfigs') {
                const configs = (0, Util_1.tryGetArray)(value);
                for (const rawConfig of configs) {
                    const builder = new ConfigBuilder_1.ConfigBuilder(rawConfig);
                    const config = builder.build();
                    this.effectiveConfig.clientConfigs.push(config);
                }
            }
            else {
                throw new RangeError(`Unexpected config key '${key}' is passed to the Hazelcast Failover Client`);
            }
        }
    }
    validate() {
        const clientConfigs = this.effectiveConfig.clientConfigs;
        (0, Util_1.assertPositiveNumber)(clientConfigs.length, 'FailoverConfig must have at least one client config.');
        const main = clientConfigs[0];
        for (const alternative of clientConfigs.slice(1)) {
            this.validateAlternativeConfigs(main, alternative);
        }
    }
    validateAlternativeConfigs(main, alternative) {
        const mainCopy = FailoverConfigBuilder.copyWithoutAllowedFields(main);
        const alternativeCopy = FailoverConfigBuilder.copyWithoutAllowedFields(alternative);
        assert(util.isDeepStrictEqual(mainCopy, alternativeCopy), 'Alternative config with cluster name ' + alternative.clusterName
            + ' must have the same config as the initial config with cluster name '
            + main.clusterName + ' except for the following options: '
            + 'clusterName, customCredentials, security, network.clusterMembers, '
            + 'network.ssl, network.hazelcastCloud');
    }
    static copyWithoutAllowedFields(config) {
        // make a shallow copy of the config
        const copy = {
            ...config
        };
        // now make a copy of config.network, as we're going to mutate it
        copy.network = {
            ...copy.network
        };
        // now get rid of allowed fields
        // note: make sure to update assertion message in validateAlternativeConfigs
        //       when this list changes
        delete copy.clusterName;
        delete copy.customCredentials;
        delete copy.security;
        delete copy.network.clusterMembers;
        delete copy.network.ssl;
        delete copy.network.hazelcastCloud;
        return copy;
    }
}
exports.FailoverConfigBuilder = FailoverConfigBuilder;
//# sourceMappingURL=FailoverConfigBuilder.js.map