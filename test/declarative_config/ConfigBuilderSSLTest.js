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

var chai = require('chai');
chai.use(require('chai-as-promised'));
var expect = chai.expect;
var path = require('path');

var ConfigBuilder = require('../../').ConfigBuilder;
var Config = require('../../').Config;
var Errors = require('../..').HazelcastErrors;

describe('ConfigBuilderSSLTest', function () {
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

    it('if both sslOptions and factory are set, should throw error', function () {
        expect(loadJson('configurations/invalid-ssl-enabled.json')).to.be.rejectedWith(Errors.HazelcastError);
        expect(loadJson('configurations/invalid-ssl-disabled.json')).to.be.rejectedWith(Errors.HazelcastError);
    });

    it('when path is undefined, exportedName should be BasicSSLOptionsFactory, otherwise should throw error', function () {
        return expect(loadJson('configurations/invalid-ssl-factory.json')).to.be.rejectedWith(Errors.HazelcastError);
    });

    it('ssl is disabled but factory is set', function () {
        return loadJson('configurations/ssl-disabled-factory-set.json').then(function () {
            var networkCfg = configFull.networkConfig;

            expect(networkCfg.sslConfig.enabled).to.be.false;
            expect(networkCfg.sslConfig.sslOptions).to.be.null;
            expect(networkCfg.sslConfig.sslOptionsFactoryConfig.path).to.be.equal('path/to/file');
            expect(networkCfg.sslConfig.sslOptionsFactoryConfig.exportedName).to.be.equal('exportedName');
            expect(networkCfg.sslConfig.sslOptionsFactoryProperties['userDefinedProperty1']).to.equal('userDefinedValue');
        })
    });

    it('ssl is disabled but options are set', function () {
        return loadJson('configurations/ssl-disabled-options-set.json').then(function () {
            var networkCfg = configFull.networkConfig;

            expect(networkCfg.sslConfig.enabled).to.be.false;
            expect(networkCfg.sslConfig.sslOptions.ca).to.be.equal('ca.pem');
            expect(networkCfg.sslConfig.sslOptions.cert).to.be.equal('cert.pem');
            expect(networkCfg.sslConfig.sslOptions.key).to.be.equal('key.pem');
            expect(networkCfg.sslConfig.sslOptionsFactoryConfig).to.be.null;
        })
    });
});

