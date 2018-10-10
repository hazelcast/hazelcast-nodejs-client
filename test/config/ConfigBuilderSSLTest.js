/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
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

require('chai').use(require('chai-as-promised'));
var expect = require('chai').expect;

var path = require('path');
var ConfigBuilder = require('../../').ConfigBuilder;
var Config = require('../../lib/index').Config;

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

    it('ssl-false', function () {
        return loadJson('hazelcast-client-ssl-false.json').then(function () {
            var networkConfig = configFull.networkConfig;
            expect(networkConfig.sslOptionsFactoryConfig).to.be.null;
            expect(networkConfig.sslOptionsFactoryProperties).to.be.null;
        });
    });

    it('when path is undefined, if exportedName should is not BasicSSLOptionsFactory shoul throw', function () {
        return expect(loadJson('hazelcast-client-ssl-basicssloptions.json')).to.be.rejected;
    });
});
