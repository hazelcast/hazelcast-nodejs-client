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
var expect = require('chai').expect;
var Config = require('../..').Config;
var HzError = require('../..').HazelcastErrors;

describe('ConfigPatternMatcherTest', function () {

    var cfg = new Config.ClientConfig();
    var f1 = new Config.FlakeIdGeneratorConfig();
    f1.prefetchValidityMillis = 111;
    f1.prefetchCount = 44;

    var f2 = new Config.FlakeIdGeneratorConfig();
    f2.prefetchValidityMillis = 1176451;
    f2.prefetchCount = 534;

    var f3 = new Config.FlakeIdGeneratorConfig();
    f2.prefetchValidityMillis = 114;
    f2.prefetchCount = 14;

    var f4 = new Config.FlakeIdGeneratorConfig();
    f4.prefetchValidityMillis = 114;
    f4.prefetchCount = 14;

    beforeEach(function () {
        cfg.flakeIdGeneratorConfigs['pref*'] = f2;
        cfg.flakeIdGeneratorConfigs['*postf'] = f3;
        cfg.flakeIdGeneratorConfigs['pref*postf'] = f4;
    });

    function assertConfig(actual, expected, name) {
        for (var prop in actual) {
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
        assertConfig(cfg.getFlakeIdGeneratorConfig('pref123postf'), f4, 'pref123postf');
        assertConfig(cfg.getFlakeIdGeneratorConfig('123postf'), f3, '123postf');
        assertConfig(cfg.getFlakeIdGeneratorConfig('pref123'), f2, 'pref123');
        assertConfig(cfg.getFlakeIdGeneratorConfig('unconfigured'), new Config.FlakeIdGeneratorConfig(), 'unconfigured');
    });

    it('lookupByPattern with explicit default', function () {
        cfg.flakeIdGeneratorConfigs['default'] = f1;
        assertConfig(cfg.getFlakeIdGeneratorConfig('pref123postf'), f4, 'pref123postf');
        assertConfig(cfg.getFlakeIdGeneratorConfig('123postf'), f3, '123postf');
        assertConfig(cfg.getFlakeIdGeneratorConfig('pref123'), f2, 'pref123');
        assertConfig(cfg.getFlakeIdGeneratorConfig('unconfigured'), f1, 'unconfigured');
    });

    it('duplicate pattern throws', function () {
        cfg.flakeIdGeneratorConfigs['abcde*'] = f2;
        expect(cfg.getFlakeIdGeneratorConfig.bind(cfg, 'abcde.somemore.postf')).to.throw(HzError.ConfigurationError);
    });
});
