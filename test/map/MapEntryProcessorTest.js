var expect = require('chai').expect;
var Client = require('../../').Client;
var Config = require('../../.').Config;
var Predicates = require('../../.').Predicates;
var Controller = require('../RC');
var fs = require('fs');
var _fillMap = require('../Util').fillMap;

function SimpleEntryProcessor() {

}

SimpleEntryProcessor.prototype.readData = function () {
    //Empty
};

SimpleEntryProcessor.prototype.writeData = function () {
    //Empty
};

SimpleEntryProcessor.prototype.getFactoryId = function () {
    return 1;
};

SimpleEntryProcessor.prototype.getClassId = function () {
    return 1;
};

var entryProcessorFactory = {
    create: function (type) {
        if (type == 1) {
            return new SimpleEntryProcessor();
        }
    }
};

describe('Entry Processor', function() {
    var MAP_SIZE = 1000;
    var cluster;
    var client;
    var map;

    function _createConfig() {
        var cfg = new Config.ClientConfig();
        cfg.serializationConfig.dataSerializableFactories[1] = entryProcessorFactory;
        return cfg;
    }

    before(function() {
        return Controller.createCluster(null, fs.readFileSync(__dirname + '/hazelcast_entryprocessor.xml', 'utf8')).then(function (res) {
            cluster = res;
            return Controller.startMember(cluster.id);
        }).then(function(member) {
            var cfg = _createConfig();
            return Client.newHazelcastClient(cfg);
        }).then(function (cli) {
            client = cli;
        });
    });

    after(function() {
        client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    beforeEach(function () {
        map = client.getMap('map-to-be-processed');
        return _fillMap(map, MAP_SIZE, '', '');
    });

    afterEach(function () {
        return map.destroy();
    });

    it('executeOnEntries should modify entries', function () {
        return map.executeOnEntries(new SimpleEntryProcessor()).then(function() {
            return map.entrySet();
        }).then(function (entries) {
            expect(entries.every(function(entry) {
                return entry[1] == entry[0] + 'processed';
            })).to.be.true;
        });
    });

    it('executeOnEntries should return modified entries', function () {
        return map.executeOnEntries(new SimpleEntryProcessor()).then(function(entries) {
            expect(entries).to.have.lengthOf(MAP_SIZE);
            expect(entries.every(function(entry) {
                return entry[1] == entry[0] + 'processed';
            })).to.be.true;
        });
    });

    it('executeOnEntries with predicate should modify entries', function () {
        return map.executeOnEntries(new SimpleEntryProcessor(), Predicates.regex('this', '^[01]$')).then(function() {
            return map.getAll(["0", "1", "2"]);
        }).then(function (entries) {
            return expect(entries).to.deep.have.members([['0', '0processed'], ['1', '1processed'], ['2', '2']]);
        });
    });

    it('executeOnEntries with predicate should return modified entries', function () {
        return map.executeOnEntries(new SimpleEntryProcessor(), Predicates.regex('this', '^[01]$')).then(function(entries) {
            expect(entries).to.have.lengthOf(2);
            expect(entries.every(function(entry) {
                return entry[1] == entry[0] + 'processed';
            })).to.be.true;
        });
    });

    it('executeOnKey should return modified value', function() {
        return map.executeOnKey('4', new SimpleEntryProcessor()).then(function (retVal) {
            return expect(retVal).to.equal('4processed');
        });
    });

    it('executeOnKey should modify the value', function() {
        return map.executeOnKey('4', new SimpleEntryProcessor()).then(function() {
            return map.get('4');
        }).then(function (value) {
            return expect(value).to.equal('4processed');
        });
    });

    it('executeOnKeys should return modified entries', function() {
        return map.executeOnKeys(['4', '5'], new SimpleEntryProcessor()).then(function (entries) {
            return expect(entries).to.deep.have.members([['4', '4processed'], ['5', '5processed']]);
        });
    });

    it('executeOnKeys should modify the entries', function() {
        return map.executeOnKeys(['4', '5'], new SimpleEntryProcessor()).then(function() {
            return map.getAll(['4', '5']);
        }).then(function (entries) {
            return expect(entries).to.deep.have.members([['4', '4processed'], ['5', '5processed']]);
        });
    });

    it('executeOnKeys with empty array should return empty array', function() {
        return map.executeOnKeys([], new SimpleEntryProcessor()).then(function (entries) {
            return expect(entries).to.have.lengthOf(0);
        });
    });

});
