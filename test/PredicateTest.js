var expect = require("chai").expect;
var HazelcastClient = require("../.").Client;
var Predicates = require("../.").Predicates;
var FalsePredicate = require("../lib/serialization/DefaultPredicates").FalsePredicate;
var TruePredicate = require("../lib/serialization/DefaultPredicates").TruePredicate;
var Promise = require("bluebird");
var Controller = require('./RC');
var Util = require('./Util');

describe("Predicates", function() {

    var cluster;
    var client;
    var map;

    before(function () {
        this.timeout(32000);
        return Controller.createCluster(null, null).then(function(res) {
            cluster = res;
            return Controller.startMember(cluster.id);
        }).then(function(member) {
            return HazelcastClient.newHazelcastClient().then(function(hazelcastClient) {
                client = hazelcastClient;
            });
        });
    });

    beforeEach(function() {
        map = client.getMap('test');
        return _fillMap();
    });

    afterEach(function() {
        return map.destroy();
    });

    after(function() {
        client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    function _fillMap(size) {
        if (size == void 0) {
            size = 50;
        }
        var promises = [];
        for (var i = 0; i< size; i++) {
            promises.push(map.put('key' + i, i));
        }
        return Promise.all(promises);
    }

    function testPredicate(predicate, expecteds) {
        return map.valuesWithPredicate(predicate).then(function(values) {
            return expect(values).to.have.members(expecteds);
        })
    }

    it('Sql', function () {
        return testPredicate(Predicates.sql('this == 10'), [10]);
    });

    it('And', function() {
        return testPredicate(Predicates.and(Predicates.isEqualTo('this', 10), Predicates.isEqualTo('this', 11)), []);
    });

    it('GreaterThan', function() {
        return testPredicate(Predicates.greaterThan('this', 47), [48, 49]);
    });

    it('GreaterEqual', function() {
        return testPredicate(Predicates.greaterEqual('this', 47), [47, 48, 49]);
    });

    it('LessThan', function() {
        return testPredicate(Predicates.lessThan('this', 4), [0, 1, 2, 3]);
    });

    it('LessEqual', function () {
        return testPredicate(Predicates.lessEqual('this', 4), [0, 1, 2, 3, 4]);
    });

    it('Like', function() {
        var localMap = client.getMap('likePredMap');
        return localMap.put('temp', 'tempval').then(function() {
            return localMap.valuesWithPredicate(Predicates.like('this', 'tempv%'));
        }).then(function (values) {
            return expect(values).to.have.members(['tempval']);
        }).then(function() {
            return localMap.destroy();
        });
    });

    it('ILike', function() {
        var localMap = client.getMap('likePredMap');
        return localMap.putAll([['temp', 'tempval'], ['TEMP', 'TEMPVAL']]).then(function() {
            return localMap.valuesWithPredicate(Predicates.ilike('this', 'tempv%'));
        }).then(function (values) {
            return expect(values).to.have.members(['tempval', 'TEMPVAL']);
        }).then(function() {
            return localMap.destroy();
        });
    });

    it('In', function () {
        return testPredicate(Predicates.inPredicate('this', 48, 49, 50, 51, 52), [48, 49]);
    });

    it('InstanceOf', function () {
        var assertionList = Array.apply(null, {length: 50}).map(Number.call, Number);
        return testPredicate(Predicates.instanceOf('java.lang.Double'), assertionList);
    });

    it('NotEqual', function() {
        var assertionList = Array.apply(null, {length: 49}).map(Number.call, Number);
        return testPredicate(Predicates.notEqual('this', 49), assertionList);
    });

    it('Not', function() {
        return testPredicate(Predicates.not(Predicates.greaterEqual('this', 2)), [0, 1]);
    });

    it('Or', function() {
        return testPredicate(Predicates.or(Predicates.greaterEqual('this', 49), Predicates.lessEqual('this', 0)), [0, 49]);
    });

    it('Regex', function() {
        var localMap = client.getMap('regexMap');
        return localMap.putAll([['06', 'ankara'], ['07', 'antalya']]).then(function() {
            return localMap.valuesWithPredicate(Predicates.regex('this', '^.*ya$'));
        }).then(function (values) {
            return expect(values).to.have.members(['antalya']);
        }).then(function() {
            return localMap.destroy();
        });
    });

    it('False', function() {
        return testPredicate(Predicates.falsePredicate(), []);
    });

    it('True', function () {
        var assertionList = Array.apply(null, {length: 50}).map(Number.call, Number);
        return testPredicate(Predicates.truePredicate(), assertionList);
    });

    it.skip('Paging first page should have first two items', function() {
        var paging = Predicates.paging(Predicates.greaterEqual('this', 40), 2);

        return testPredicate(paging, [40, 41]);
    });

    it.skip('Paging nextPage should have 3rd and 4th items', function() {
        var paging = Predicates.paging(Predicates.greaterEqual('this', 40), 2);
        paging.nextPage();

        return testPredicate(paging, [42, 43]);
    });

    it.skip('Paging fourth page should have 7th and 8th items', function() {
        var paging = Predicates.paging(Predicates.greaterEqual('this', 40), 2);
        paging.setPage(4);

        return testPredicate(paging, [46, 47]);
    });

    it.skip('Paging #getPage should return approprate value', function() {
        var paging = Predicates.paging(Predicates.greaterEqual('this', 40), 2);
        paging.setPage(4);
        return expect(paging.getPage()).to.equal(4);
    });

    it.skip('Paging #getPageSize should return 2', function() {
        var paging = PPredicates.paging(Predicates.greaterEqual('this', 40), 2);
        return expect(paging.getPageSize()).to.equal(2);
    });

    it.skip('Paging previousPage', function () {
        var paging = Predicates.paging(Predicates.greaterEqual('this', 40), 2);
        paging.setPage(4);
        paging.previousPage();

        return testPredicate(paging, [44, 45]);
    });
});
