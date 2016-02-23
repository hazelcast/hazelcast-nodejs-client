var expect = require("chai").expect;
var HazelcastClient = require("../lib/HazelcastClient");


describe("MapProxy Test", function() {

    var client;

    before(function () {
        return HazelcastClient.newHazelcastClient().then(function(hazelcastClient) {
            client = hazelcastClient;
        });
    });

    it('putOnSameKeyShouldReturnOldValue', function() {
        var map = client.getMap('test-twice-put-map');
        return map.put('test-key', 'first-val').then(function(v) {
            return map.put('test-key', 'second-val');
        }).then(function(returnVal) {
            expect(returnVal).to.be.equal('first-val');
        });
    });
});


