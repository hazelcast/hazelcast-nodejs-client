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
var ClientConfig = require('../../').Config.ClientConfig;
require('chai').use(require('chai-as-promised'));
var path = require('path');
var ConfigBuilder = require('../../').ConfigBuilder;

describe('ConfigBuilderHazelcastCloud Test', function () {
    var configFull;

    afterEach(function () {
        delete process.env['HAZELCAST_CLIENT_CONFIG'];
    });

    function loadJson(jsonPath) {
        var configBuilder = new ConfigBuilder();
        process.env['HAZELCAST_CLIENT_CONFIG'] = path.join(__dirname, jsonPath);
        return configBuilder.loadConfig().then(function () {
            configFull = configBuilder.build();
        });
    }

    it('cloudConfig', function () {
        return loadJson('configurations/full.json').then(function () {
            var networkConfig = configFull.networkConfig;
            expect(networkConfig.cloudConfig.enabled).to.be.false;
            expect(networkConfig.cloudConfig.discoveryToken).to.be.equal('EXAMPLE_TOKEN');
        });
    });

    it('cloudConfig_enabled_nullToken', function () {
        return expect(loadJson('configurations/invalid-cloud.json')).to.be.rejectedWith(Error);
    });

    it('cloudConfig_defaults', function () {
        var clientConfig = new ClientConfig();
        expect(clientConfig.networkConfig.cloudConfig.enabled).to.be.false;
        expect(clientConfig.networkConfig.cloudConfig.discoveryToken).to.be.null;

    });

    it('cloudConfig_enabled', function () {
        return loadJson('configurations/cloud-enabled.json').then(function () {
            var networkConfig = configFull.networkConfig;
            expect(networkConfig.cloudConfig.enabled).to.be.true;
            expect(networkConfig.cloudConfig.discoveryToken).to.be.equal('EXAMPLE_TOKEN');
        });
    });
});
