var expect = require("chai").expect;
var HazelcastClient = require("../lib/client")


describe("Map", function() {
    var map;

    var testKey = "foo";
    var testValue = {"value": "bar"};

    before(function() {
        return HazelcastClient.create({
            "username": "dev",
            "password": "dev-pass",
            "port": 5701,
            "host": "localhost"
        }).then(function (client) {
            map = client.getMap("map");
        });
    });

    beforeEach(function () {
        return map.put(testKey, testValue)
    });

    it("puts", function () {
        return map.put(testKey, {"value": "baz"}).then(function (result) {
            expect(result.value).to.be.equal("bar");
        });
    });

    it("gets", function () {
        return map.get(testKey).then(function (result) {
            expect(result).to.be.deep.equal(testValue);
        });
    });

    it("remove", function () {
        return map.remove(testKey).then(function () {
            return map.get(testKey);
        }).then(function (result) {
            expect(result).to.be.null;
        });
    });

});


