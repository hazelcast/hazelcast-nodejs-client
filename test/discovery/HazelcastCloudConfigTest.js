/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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

var expect = require('chai').expect;

var HazelcastCloudDiscovery = require('../../lib/discovery/HazelcastCloudDiscovery').HazelcastCloudDiscovery;
var ClientConfig = require('../../').Config.ClientConfig;

describe('Hazelcast ClientCloudConfig Test', function () {

    it('defaultCloudUrlEndpoint', function () {
        var config = new ClientConfig();

        var token = 'TOKEN';
        config.networkConfig.cloudConfig.discoveryToken = token;

        var urlEndpoint = HazelcastCloudDiscovery.createUrlEndpoint(config.properties, token);

        expect(urlEndpoint).to.be.equal('https://coordinator.hazelcast.cloud/cluster/discovery?token=TOKEN');
    });

    it('customCloudUrlEndpoint', function () {
        var config = new ClientConfig();

        var token = 'TOKEN';
        config.networkConfig.cloudConfig.discoveryToken = token;
        config.properties['hazelcast.client.cloud.url'] = 'https://custom';

        var urlEndpoint = HazelcastCloudDiscovery.createUrlEndpoint(config.properties, token);

        expect(urlEndpoint).to.be.equal('https://custom/cluster/discovery?token=TOKEN');
    });

});
