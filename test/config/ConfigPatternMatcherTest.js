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
'use strict';

const expect = require('chai').expect;
const ConfigBuilder = require('../../lib/config/ConfigBuilder').ConfigBuilder;
const FlakeIdGeneratorConfigImpl = require('../../lib/config/FlakeIdGeneratorConfig').FlakeIdGeneratorConfigImpl;
const Errors = require('../..').HazelcastErrors;

describe('ConfigPatternMatcherTest', function () {

    const inputConfig = {
        flakeIdGenerators: {}
    };
    const f1 = {
        prefetchValidityMillis: 111,
        prefetchCount: 44
    };
    const f2 = {
        prefetchValidityMillis: 1176451,
        prefetchCount: 534
    };
    const f3 = {
        prefetchValidityMillis: 114,
        prefetchCount: 14
    };
    const f4 = {
        prefetchValidityMillis: 42,
        prefetchCount: 4
    };

    beforeEach(function () {
        inputConfig.flakeIdGenerators['pref*'] = f2;
        inputConfig.flakeIdGenerators['*postf'] = f3;
        inputConfig.flakeIdGenerators['pref*postf'] = f4;
    });

    function assertConfig(actual, expected, name) {
        for (const prop in actual) {
            if (typeof actual[prop] !== 'function') {
                if (prop === 'name') {
                    expect(actual[prop]).to.be.equal(name);
                } else {
                    expect(actual[prop]).to.be.equal(expected[prop]);
                }
            }
        }
    }

    it('lookupByPattern', function () {
        const config = new ConfigBuilder(inputConfig).build();

        assertConfig(config.getFlakeIdGeneratorConfig('pref123postf'), f4, 'pref123postf');
        assertConfig(config.getFlakeIdGeneratorConfig('123postf'), f3, '123postf');
        assertConfig(config.getFlakeIdGeneratorConfig('pref123'), f2, 'pref123');
        assertConfig(config.getFlakeIdGeneratorConfig('unconfigured'), new FlakeIdGeneratorConfigImpl(), 'unconfigured');
    });

    it('lookupByPattern with explicit default', function () {
        inputConfig.flakeIdGenerators['default'] = f1;
        const config = new ConfigBuilder(inputConfig).build();

        assertConfig(config.getFlakeIdGeneratorConfig('pref123postf'), f4, 'pref123postf');
        assertConfig(config.getFlakeIdGeneratorConfig('123postf'), f3, '123postf');
        assertConfig(config.getFlakeIdGeneratorConfig('pref123'), f2, 'pref123');
        assertConfig(config.getFlakeIdGeneratorConfig('unconfigured'), f1, 'unconfigured');
    });

    it('duplicate pattern throws', function () {
        inputConfig.flakeIdGenerators['abcde*'] = f2;
        const config = new ConfigBuilder(inputConfig).build();

        expect(config.getFlakeIdGeneratorConfig.bind(inputConfig, 'abcde.somemore.postf')).to.throw(Errors.ConfigurationError);
    });
});
