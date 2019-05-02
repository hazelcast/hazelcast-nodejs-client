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
var ItemEventType = require('../../lib/core/ItemListener').ItemEventType;

describe("List Proxy", function () {

    var cluster;
    var client;
    var listInstance;

    before(function () {
        this.timeout(10000);
        return Controller.createCluster().then(function (response) {
            cluster = response;
            return Controller.startMember(cluster.id);
        }).then(function () {
            return HazelcastClient.newHazelcastClient().then(function (hazelcastClient) {
                client = hazelcastClient;
            });
        });
    });

    beforeEach(function () {
        return client.getList('test').then(function (list) {
            listInstance = list;
        })
    });

    afterEach(function () {
        return listInstance.destroy();
    });

    after(function () {
        client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });


    it("appends one item", function () {
        return listInstance.add(1).then(function () {
            return listInstance.size();
        }).then(function (size) {
            expect(size).to.equal(1);
        });
    });

    it("inserts one item at index", function () {
        return listInstance.addAll([1, 2, 3]).then(function () {
            return listInstance.addAt(1, 5);
        }).then(function () {
            return listInstance.toArray();
        }).then(function (all) {
            expect(all).to.deep.equal([1, 5, 2, 3]);
        });
    });

    it("clears", function () {
        return listInstance.addAll([1, 2, 3]).then(function () {
            return listInstance.clear();
        }).then(function () {
            return listInstance.size();
        }).then(function (size) {
            expect(size).to.equal(0);
        });
    });


    it("inserts all elements of array at index", function () {
        return listInstance.addAll([1, 2, 3]).then(function () {
            return listInstance.addAllAt(1, [5, 6]);
        }).then(function () {
            return listInstance.toArray();
        }).then(function (all) {
            expect(all).to.deep.equal([1, 5, 6, 2, 3])
        });
    });


    it("gets item at index", function () {
        var input = [1, 2, 3];
        return listInstance.addAll(input).then(function () {
            return listInstance.get(1);
        }).then(function (result) {
            expect(result).to.equal(2);
        });
    });

    it("removes item at index", function () {
        var input = [1, 2, 3];
        return listInstance.addAll(input).then(function () {
            return listInstance.removeAt(1);
        }).then(function (removed) {
            expect(removed).to.equal(2);
            return listInstance.toArray();
        }).then(function (all) {
            expect(all).to.deep.equal([1, 3]);
        });
    });

    it("replaces item at index", function () {
        var input = [1, 2, 3];
        return listInstance.addAll(input).then(function () {
            return listInstance.set(1, 6);
        }).then(function (replaced) {
            expect(replaced).to.equal(2);
            return listInstance.toArray();
        }).then(function (all) {
            expect(all).to.deep.equal([1, 6, 3]);
        });
    });


    it("contains", function () {
        var input = [1, 2, 3];
        return listInstance.addAll(input).then(function () {
            return listInstance.contains(1);
        }).then(function (contains) {
            expect(contains).to.be.true;
        });
    });

    it("does not contain", function () {
        var input = [1, 2, 3];
        return listInstance.addAll(input).then(function () {
            return listInstance.contains(5);
        }).then(function (contains) {
            expect(contains).to.be.false;
        });
    });

    it("contains all", function () {
        return listInstance.addAll([1, 2, 3]).then(function () {
            return listInstance.containsAll([1, 2]);
        }).then(function (contains) {
            expect(contains).to.be.true;
        });
    });

    it("does not contain all", function () {
        return listInstance.addAll([1, 2, 3]).then(function () {
            return listInstance.containsAll([3, 4]);
        }).then(function (contains) {
            expect(contains).to.be.false;
        });
    });

    it("is empty", function () {
        return listInstance.isEmpty().then(function (empty) {
            expect(empty).to.be.true;
        });
    });


    it("is not empty", function () {
        return listInstance.add(1).then(function (empty) {
            return listInstance.isEmpty();
        }).then(function (empty) {
            expect(empty).to.be.false;
        });
    });


    it("removes an entry", function () {
        return listInstance.addAll([1, 2, 3]).then(function () {
            return listInstance.remove(1)
        }).then(function () {
            return listInstance.toArray();
        }).then(function (all) {
            expect(all).to.deep.equal([2, 3]);
        });
    });

    it("removes an entry by index", function () {
        return listInstance.addAll([1, 2, 3]).then(function () {
            return listInstance.removeAt(1)
        }).then(function () {
            return listInstance.toArray();
        }).then(function (all) {
            expect(all).to.deep.equal([1, 3]);
        });
    });

    it("removes multiple entries", function () {
        return listInstance.addAll([1, 2, 3, 4]).then(function () {
            return listInstance.removeAll([1, 2]);
        }).then(function () {
            return listInstance.toArray();
        }).then(function (all) {
            expect(all).to.deep.equal([3, 4]);
        });
    });

    it("retains multiple entries", function () {
        return listInstance.addAll([1, 2, 3, 4]).then(function () {
            return listInstance.retainAll([1, 2]);
        }).then(function () {
            return listInstance.toArray();
        }).then(function (all) {
            expect(all).to.deep.equal([1, 2]);
        });
    });

    it("finds index of the element", function () {
        return listInstance.addAll([1, 2, 4, 4]).then(function () {
            return listInstance.indexOf(4);
        }).then(function (index) {
            expect(index).to.equal(2);
        });
    });

    it("finds last index of the element", function () {
        return listInstance.addAll([1, 2, 4, 4]).then(function () {
            return listInstance.lastIndexOf(4);
        }).then(function (index) {
            expect(index).to.equal(3);
        });
    });

    it("returns a sub list", function () {
        return listInstance.addAll([1, 2, 3, 4, 5, 6]).then(function () {
            return listInstance.subList(1, 5);
        }).then(function (subList) {
            expect(subList.toArray()).to.deep.equal([2, 3, 4, 5]);
        });
    });

    it("listens for added entry", function (done) {
        this.timeout(5000);
        var listener = {
            itemAdded: function (itemEvent) {
                expect(itemEvent.name).to.be.equal('test');
                expect(itemEvent.item).to.be.equal(1);
                expect(itemEvent.eventType).to.be.equal(ItemEventType.ADDED);
                expect(itemEvent.member).to.not.be.equal(null);
                done();
            }
        };
        listInstance.addItemListener(listener, true).then(function () {
            listInstance.add(1);
        }).catch(function (e) {
            done(e);
        })
    });

    it("listens for added and removed entry", function (done) {
        this.timeout(5000);
        var added = false;
        var listener = {
            itemAdded: function (itemEvent) {
                expect(itemEvent.name).to.be.equal('test');
                expect(itemEvent.item).to.be.equal(2);
                expect(itemEvent.eventType).to.be.equal(ItemEventType.ADDED);
                expect(itemEvent.member).to.not.be.equal(null);
                added = true;
            },
            itemRemoved: function (itemEvent) {
                expect(itemEvent.name).to.be.equal('test');
                expect(itemEvent.item).to.be.equal(2);
                expect(itemEvent.eventType).to.be.equal(ItemEventType.REMOVED);
                expect(itemEvent.member).to.not.be.equal(null);
                expect(added).to.be.true;
                done();
            }
        };
        listInstance.addItemListener(listener, true).then(function () {
            return listInstance.add(2);
        }).then(function () {
            return listInstance.remove(2);
        }).catch(function (e) {
            done(e);
        })
    });

    it("listens for removed entry with value included", function (done) {
        this.timeout(5000);
        var listener = {
            itemRemoved: function (itemEvent) {
                expect(itemEvent.name).to.be.equal('test');
                expect(itemEvent.item).to.be.equal(1);
                expect(itemEvent.eventType).to.be.equal(ItemEventType.REMOVED);
                expect(itemEvent.member).to.not.be.equal(null);
                done();
            }
        };
        listInstance.addItemListener(listener, true).then(function () {
            return listInstance.add(1);
        }).then(function () {
            return listInstance.remove(1);
        }).catch(function (e) {
            done(e);
        })
    });

    it("listens for removed entry with value not included", function (done) {
        this.timeout(5000);
        var listener = {
            itemRemoved: function (itemEvent) {
                expect(itemEvent.name).to.be.equal('test');
                expect(itemEvent.item).to.be.equal(null);
                expect(itemEvent.eventType).to.be.equal(ItemEventType.REMOVED);
                expect(itemEvent.member).to.not.be.equal(null);
                done();
            }
        };
        listInstance.addItemListener(listener, false).then(function () {
            return listInstance.add(1);
        }).then(function () {
            return listInstance.remove(1);
        }).catch(function (e) {
            done(e);
        })
    });


    it("remove entry listener", function () {
        this.timeout(5000);
        return listInstance.addItemListener({

            itemRemoved: function (itemEvent) {
                expect(itemEvent.name).to.be.equal('test');
                expect(itemEvent.item).to.be.equal(1);
                expect(itemEvent.eventType).to.be.equal(ItemEventType.REMOVED);
                expect(itemEvent.member).to.not.be.equal(null);
                done();
            }
        }).then(function (registrationId) {
            return listInstance.removeItemListener(registrationId);
        }).then(function (removed) {
            expect(removed).to.be.true;
        })
    });
});
