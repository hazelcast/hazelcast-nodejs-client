var expect = require("chai").expect;
var HazelcastClient = require("../../lib/index.js").Client;
var Controller = require('./../RC');
var Util = require('./../Util');

describe("MultiMap Proxy Listener", function () {

    this.timeout(10000);

    var cluster;
    var client;

    var map;

    before(function () {
        this.timeout(10000);
        return Controller.createCluster().then(function (response) {
            cluster = response;
            return Controller.startMember(cluster.id);
        }).then(function () {
            return HazelcastClient.newHazelcastClient().then(function (hazelcastClient) {
                client = hazelcastClient;
            })
        });
    });

    beforeEach(function () {
        map = client.getMultiMap('test');
    });

    afterEach(function () {
        return map.destroy();
    });

    after(function () {
        client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    function Listener(eventName, doneCallback, expectedKey, expectedOldValue, expectedValue) {

        this[eventName] = function (key, oldValue, value) {
            try {
                expect(key).to.equal(expectedKey);
                expect(oldValue).to.equal(expectedOldValue);
                expect(value).to.equal(expectedValue);
                doneCallback()
            } catch (err) {
                doneCallback(err);
            }
        }
    }

    // Add tests

    it("listens for add with value excluded", function (done) {
        var listener = new Listener("added", done, "foo", undefined, undefined);

        map.addEntryListener(listener, null, false).then(function () {
            map.put("foo", "bar");
        });
    });


    it("listens for add with value included", function (done) {
        var listener = new Listener("added", done, "foo", undefined, "bar");

        map.addEntryListener(listener, null, true).then(function () {
            map.put("foo", "bar");
        });
    });

    it("listens for add to specific key", function (done) {
        var listener = new Listener("added", done, "foo", undefined, undefined);

        map.addEntryListener(listener, "foo", false).then(function () {
            map.put("foo", "bar");
        });
    });

    it("does not react to add on the wrong key", function (done) {
        var listener = {
            added: function () {
                done("Reacted to update on the wrong key");
            }
        };

        setTimeout(function () {
            done();
        }, 5000);

        map.addEntryListener(listener, "xyz", false).then(function () {
            map.put("foo", "bar");
        });
    });

    // Remove tests

    it("listens for remove with value excluded", function (done) {
        var listener = new Listener("removed", done, "foo", undefined, undefined);

        map.addEntryListener(listener, null, false).then(function () {
            return map.put("foo", "bar");
        }).then(function () {
            return map.remove("foo", "bar");
        });
    });

    it("listens for remove with value included", function (done) {
        var listener = new Listener("removed", done, "foo", "bar", undefined);

        map.addEntryListener(listener, null, true).then(function () {
            return map.put("foo", "bar");
        }).then(function () {
            return map.remove("foo", "bar");
        });
    });

    it("listens for remove on specific key", function (done) {
        var listener = new Listener("added", done, "foo", undefined, undefined);

        map.addEntryListener(listener, "foo", false).then(function () {
            return map.put("foo", "bar");
        }).then(function () {
            return map.remove("foo", "bar");
        });
    });

    it("does not react to remove on the wrong key", function (done) {
        var listener = {
            added: function () {
                done("Reacted to update on the wrong key");
            }
        };

        setTimeout(function () {
            done();
        }, 5000);

        map.addEntryListener(listener, "xyz", false).then(function () {
            return map.put("foo", "bar");
        }).then(function () {
            return map.remove("foo", "bar");
        });
    });

    // Other

    it("listens for clear", function (done) {
        this.timeout(10000);
        var listener = {
            clearedAll: function (key, oldValue, value) {
                try {
                    expect(key).to.be.undefined;
                    expect(oldValue).to.be.undefined;
                    expect(value).to.be.undefined;
                    done();
                } catch (err) {
                    done(err);
                }

            }
        };

        map.addEntryListener(listener, null, true).then(function () {
            return map.put("foo", "bar");
        }).then(function () {
            return map.clear();
        });
    });

    it("removes present listener", function () {
        return map.addEntryListener({}, null, true).then(function (registrationId) {
            return map.removeEntryListener(registrationId);
        }).then(function (removed) {
            expect(removed).to.be.true;
        });
    });

    it("removes present listener", function () {
        return map.removeEntryListener("foo").then(function (removed) {
            expect(removed).to.be.false;
        });
    });



});
