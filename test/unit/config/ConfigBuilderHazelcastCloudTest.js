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

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const path = require('path');

const { ClientConfigImpl } = require('../../../lib/config/Config');
const { ConfigBuilder } = require('../../../lib/config/ConfigBuilder');

describe('ConfigBuilderHazelcastCloudTest', function () {
    function loadJson(jsonPath) {
        const config = require(path.join(__dirname, jsonPath));
        return new ConfigBuilder(config).build();
    }

    it('hazelcastCloud_full', function () {
        const config = loadJson('configurations/full.json');
        expect(config.network.hazelcastCloud.discoveryToken).to.be.equal('EXAMPLE_TOKEN');
    });

    it('hazelcastCloud_enabled_nullToken', function () {
        return expect(() => loadJson('configurations/invalid-cloud.json')).to.throw(Error);
    });

    it('hazelcastCloud_defaults', function () {
        const clientConfig = new ClientConfigImpl();
        expect(clientConfig.network.hazelcastCloud.discoveryToken).to.be.null;
    });

    it('hazelcastCloud_enabled', function () {
        const config = loadJson('configurations/cloud-enabled.json');
        expect(config.network.hazelcastCloud.discoveryToken).to.be.equal('EXAMPLE_TOKEN');
    });
});
