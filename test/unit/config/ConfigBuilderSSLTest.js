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
'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const path = require('path');

const { HazelcastError } = require('../../../');
const { ConfigBuilder } = require('../../../lib/config/ConfigBuilder');

describe('ConfigBuilderSSLTest', function () {

    function loadJson(jsonPath) {
        const config = require(path.join(__dirname, jsonPath));
        return new ConfigBuilder(config).build();
    }

    it('if both sslOptions and factory are set, should throw error', function () {
        expect(() => loadJson('configurations/invalid-ssl-enabled.json')).to.throw(HazelcastError);
        expect(() => loadJson('configurations/invalid-ssl-disabled.json')).to.throw(HazelcastError);
    });

    it('ssl is disabled but options are set', function () {
        const config = loadJson('configurations/ssl-disabled-options-set.json');
        const networkCfg = config.network;
        expect(networkCfg.ssl.enabled).to.be.false;
        expect(networkCfg.ssl.sslOptions.ca).to.be.equal('ca.pem');
        expect(networkCfg.ssl.sslOptions.cert).to.be.equal('cert.pem');
        expect(networkCfg.ssl.sslOptions.key).to.be.equal('key.pem');
        expect(networkCfg.ssl.sslOptionsFactory).to.be.null;
    });
});
