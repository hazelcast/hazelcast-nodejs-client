var expect = require("chai").expect;
var HazelcastClient = require("../lib/client");

var toBuffer = function (value, serializerId) {
    var valueLength = value.length;
    var buffer = new Buffer(valueLength + 8);
    buffer.writeInt32LE(serializerId, 0);
    buffer.writeInt32LE(serializerId, 4);
    buffer.write(value, 8);
    return buffer;
};

describe("Map", function () {
    var map;

    before(function () {
        return HazelcastClient.create({
            "username": "dev",
            "password": "dev-pass",
            "port": 5701,
            "host": "localhost"
        }).then(function (client) {
            map = client.getMap("objects");
        });
    });

    /*
    For this test set map format to OBJECT
     */
    it("throws exception on invalid binary payload", function () {
        var keyBuffer = toBuffer("foo", -11);
        // this one has invalid serializer ID.
        var valueBuffer = toBuffer("bar", -1024);
        return map.putRaw(keyBuffer, valueBuffer, 0).catch(function (error) {
            expect(error.errorCode).to.be.equal(23);
            expect(error.className).to.be.equal("com.hazelcast.nio.serialization.HazelcastSerializationException");
            // We cannot rely on stack trace being the same between versions, so we are just going to check that it is not empty
            expect(error.stackTrace).to.not.be.empty;
        });
    });

});


