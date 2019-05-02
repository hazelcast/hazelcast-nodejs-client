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
var Client = require('../../').Client;
var Config = require('../../.').Config;
var Predicates = require('../../.').Predicates;
var Controller = require('../RC');
var fs = require('fs');
var _fillMap = require('../Util').fillMap;

var IdentifiedFactory = require('../javaclasses/IdentifiedFactory');
var IdentifiedEntryProcessor = require('../javaclasses/IdentifiedEntryProcessor');

describe('Entry Processor', function () {
    var MAP_SIZE = 1000;
    var cluster;
    var client;
    var map;

    function _createConfig() {
        var cfg = new Config.ClientConfig();
        cfg.serializationConfig.dataSerializableFactories[66] = new IdentifiedFactory();
        return cfg;
    }

    before(function () {
        return Controller.createCluster(null, fs.readFileSync(__dirname + '/hazelcast_identifiedfactory.xml', 'utf8')).then(function (res) {
            cluster = res;
            return Controller.startMember(cluster.id);
        }).then(function (member) {
            var cfg = _createConfig();
            return Client.newHazelcastClient(cfg);
        }).then(function (cli) {
            client = cli;
        });
    });

    after(function () {
        client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    beforeEach(function () {
        return client.getMap('map-to-be-processed').then(function (mp) {
            map = mp;
            return _fillMap(map, MAP_SIZE, '', '');
        });

    });

    afterEach(function () {
        return map.destroy();
    });

    it('executeOnEntries should modify entries', function () {
        this.timeout(4000);
        return map.executeOnEntries(new IdentifiedEntryProcessor('processed')).then(function () {
            return map.entrySet();
        }).then(function (entries) {
            expect(entries.every(function (entry) {
                return entry[1] == 'processed';
            })).to.be.true;
        });
    });

    it('executeOnEntries should return modified entries', function () {
        this.timeout(4000);
        return map.executeOnEntries(new IdentifiedEntryProcessor('processed')).then(function (entries) {
            expect(entries).to.have.lengthOf(MAP_SIZE);
            expect(entries.every(function (entry) {
                return entry[1] == 'processed';
            })).to.be.true;
        });
    });

    it('executeOnEntries with predicate should modify entries', function () {
        this.timeout(4000);
        return map.executeOnEntries(new IdentifiedEntryProcessor('processed'), Predicates.regex('this', '^[01]$')).then(function () {
            return map.getAll(["0", "1", "2"]);
        }).then(function (entries) {
            return expect(entries).to.deep.have.members([['0', 'processed'], ['1', 'processed'], ['2', '2']]);
        });
    });

    it('executeOnEntries with predicate should return modified entries', function () {
        this.timeout(4000);
        return map.executeOnEntries(new IdentifiedEntryProcessor('processed'), Predicates.regex('this', '^[01]$')).then(function (entries) {
            expect(entries).to.have.lengthOf(2);
            expect(entries.every(function (entry) {
                return entry[1] == 'processed';
            })).to.be.true;
        });
    });

    it('executeOnKey should return modified value', function () {
        this.timeout(4000);
        return map.executeOnKey('4', new IdentifiedEntryProcessor('processed')).then(function (retVal) {
            return expect(retVal).to.equal('processed');
        });
    });

    it('executeOnKey should modify the value', function () {
        this.timeout(4000);
        return map.executeOnKey('4', new IdentifiedEntryProcessor('processed')).then(function () {
            return map.get('4');
        }).then(function (value) {
            return expect(value).to.equal('processed');
        });
    });

    it('executeOnKeys should return modified entries', function () {
        this.timeout(4000);
        return map.executeOnKeys(['4', '5'], new IdentifiedEntryProcessor('processed')).then(function (entries) {
            return expect(entries).to.deep.have.members([['4', 'processed'], ['5', 'processed']]);
        });
    });

    it('executeOnKeys should modify the entries', function () {
        this.timeout(4000);
        return map.executeOnKeys(['4', '5'], new IdentifiedEntryProcessor('processed')).then(function () {
            return map.getAll(['4', '5']);
        }).then(function (entries) {
            return expect(entries).to.deep.have.members([['4', 'processed'], ['5', 'processed']]);
        });
    });

    it('executeOnKeys with empty array should return empty array', function () {
        this.timeout(4000);
        return map.executeOnKeys([], new IdentifiedEntryProcessor('processed')).then(function (entries) {
            return expect(entries).to.have.lengthOf(0);
        });
    });

});
