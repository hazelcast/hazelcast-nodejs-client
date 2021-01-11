/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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
'use strict';

const expect = require("chai").expect;
const HazelcastClient = require("../../lib/index.js").Client;
const RC = require('./../RC');
const Util = require('./../Util');

describe("MultiMap Proxy Listener", function () {

    let cluster;
    let client;
    let map;

    before(function () {
        return RC.createCluster().then(function (response) {
            cluster = response;
            return RC.startMember(cluster.id);
        }).then(function () {
            return HazelcastClient.newHazelcastClient({ clusterName: cluster.id });
        }).then(function (hazelcastClient) {
            client = hazelcastClient;
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
        return client.shutdown()
            .then(() => RC.terminateCluster(cluster.id));
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
        const listener = new Listener("added", done, "test", "foo", null, null, null);

        map.addEntryListener(listener, null, false).then(function () {
            map.put("foo", "bar");
        });
    });


    it("listens for add with value included", function (done) {
        const listener = new Listener("added", done, "test", "foo", "bar", null, null);

        map.addEntryListener(listener, null, true).then(function () {
            map.put("foo", "bar");
        });
    });

    it("listens for add to specific key", function (done) {
        const listener = new Listener("added", done, "test", "foo", null, null, null);

        map.addEntryListener(listener, "foo", false).then(function () {
            map.put("foo", "bar");
        });
    });

    it("does not react to add on the wrong key", function (done) {
        const listener = {
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
        const listener = new Listener("removed", done, "test", "foo", null, null, null);

        map.addEntryListener(listener, null, false).then(function () {
            return map.put("foo", "bar");
        }).then(function () {
            return map.remove("foo", "bar");
        });
    });

    it("listens for remove with value included", function (done) {
        const listener = new Listener("removed", done, "test", "foo", null, "bar", null);

        map.addEntryListener(listener, null, true).then(function () {
            return map.put("foo", "bar");
        }).then(function () {
            return map.remove("foo", "bar");
        });
    });

    it("listens for remove on specific key", function (done) {
        const listener = new Listener("added", done, "test", "foo", null, null, null);

        map.addEntryListener(listener, "foo", false).then(function () {
            return map.put("foo", "bar");
        }).then(function () {
            return map.remove("foo", "bar");
        });
    });

    it("does not react to remove on the wrong key", function (done) {
        const listener = {
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
        const listener = {
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

    it('fires event for each pair of putAll', function (done) {
        Util.markServerVersionAtLeast(this, client, '4.1');
        let expectedEventCount = 3;
        const listener = (key, values) => {
            return {
                added: (event) => {
                    expect(event.key).to.equal(key);
                    expect(values).to.include(event.value);
                    expectedEventCount--;
                    if (expectedEventCount === 0) {
                        done();
                    } else if (expectedEventCount < 0) {
                        done(new Error('Received too many events'));
                    }
                }
            }
        };

        map.addEntryListener(listener('a', [1]), 'a')
            .then(() => map.addEntryListener(listener('b', [2, 22]), 'b'))
            .then(() => map.putAll([['a', [1]], ['b', [2, 22]]]));
    });
});
