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
        return client.getMultiMap('test').then(function (mp) {
            map = mp;
        });
    });

    afterEach(function () {
        return map.destroy();
    });

    after(function () {
        client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    function Listener(eventName, doneCallback, expectedName, expectedKey, expectedValue, expectedOldValue,
                      expectedMergingValue) {

        this[eventName] = function (entryEvent) {
            try {
                expect(entryEvent.name).to.equal(expectedName);
                expect(entryEvent.key).to.equal(expectedKey);
                expect(entryEvent.value).to.equal(expectedValue);
                expect(entryEvent.oldValue).to.equal(expectedOldValue);
                expect(entryEvent.mergingValue).to.equal(expectedMergingValue);
                expect(entryEvent.member).to.not.be.equal(null);
                doneCallback();
            } catch (err) {
                doneCallback(err);
            }
        }
    }

    // Add tests

    it("listens for add with value excluded", function (done) {
        var listener = new Listener("added", done, "test", "foo", undefined, undefined, undefined);

        map.addEntryListener(listener, null, false).then(function () {
            map.put("foo", "bar");
        });
    });


    it("listens for add with value included", function (done) {
        var listener = new Listener("added", done, "test", "foo", "bar", undefined, undefined);

        map.addEntryListener(listener, null, true).then(function () {
            map.put("foo", "bar");
        });
    });

    it("listens for add to specific key", function (done) {
        var listener = new Listener("added", done, "test", "foo", undefined, undefined, undefined);

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
        var listener = new Listener("removed", done, "test", "foo", undefined, undefined, undefined);

        map.addEntryListener(listener, null, false).then(function () {
            return map.put("foo", "bar");
        }).then(function () {
            return map.remove("foo", "bar");
        });
    });

    it("listens for remove with value included", function (done) {
        var listener = new Listener("removed", done, "test", "foo", undefined, "bar", undefined);

        map.addEntryListener(listener, null, true).then(function () {
            return map.put("foo", "bar");
        }).then(function () {
            return map.remove("foo", "bar");
        });
    });

    it("listens for remove on specific key", function (done) {
        var listener = new Listener("added", done, "test", "foo", undefined, undefined, undefined);

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
            mapCleared: function (mapEvent) {
                try {
                    expect(mapEvent.name).to.be.equal("test");
                    expect(mapEvent.numberOfAffectedEntries).to.be.equal(1);
                    expect(mapEvent.member).to.not.be.equal(null);
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
