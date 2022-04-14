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
'use strict';

const { expect } = require('chai');
const { ClientConfigImpl } = require('../../../lib/config/Config');
const { HazelcastCloudDiscovery } = require('../../../lib/discovery/HazelcastCloudDiscovery');

describe('HazelcastClientCloudConfigTest', function () {
    it('defaultCloudUrlEndpoint', function () {
        const config = new ClientConfigImpl();
        const token = 'TOKEN';
        config.network.hazelcastCloud.discoveryToken = token;

        const urlEndpoint = HazelcastCloudDiscovery.createUrlEndpoint(config.properties, token);

        expect(urlEndpoint).to.be.equal('https://coordinator.hazelcast.cloud/cluster/discovery?token=TOKEN');
    });

    it('customCloudUrlEndpoint', function () {
        const config = new ClientConfigImpl();
        const token = 'TOKEN';
        config.network.hazelcastCloud.discoveryToken = token;
        config.properties['hazelcast.client.cloud.url'] = 'https://custom';

        const urlEndpoint = HazelcastCloudDiscovery.createUrlEndpoint(config.properties, token);

        expect(urlEndpoint).to.be.equal('https://custom/cluster/discovery?token=TOKEN');
    });
});
