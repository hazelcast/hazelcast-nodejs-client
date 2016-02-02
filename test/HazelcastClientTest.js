var expect = require("chai").expect;
var HazelcastClient = require("../lib/HazelcastClient");


describe("HazelcastClient", function() {

    it('connection', function(done) {
        var client = new HazelcastClient();
        client.init().then(function() {
            console.log('initialized client');
            done();
        });

    });
});


