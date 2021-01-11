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

const expect = require('chai').expect;
const RC = require('./../RC');
const { Client } = require('../../');
const { ItemEventType } = require('../../lib/proxy/ItemListener');

describe('ListProxyTest', function () {

    let cluster;
    let client;
    let list;

    before(function () {
        return RC.createCluster().then(function (response) {
            cluster = response;
            return RC.startMember(cluster.id);
        }).then(function () {
            return Client.newHazelcastClient({ clusterName: cluster.id })
                .then(function (hazelcastClient) {
                    client = hazelcastClient;
                });
        });
    });

    beforeEach(function () {
        return client.getList('test').then(function (l) {
            list = l;
        });
    });

    afterEach(function () {
        return list.destroy();
    });

    after(function () {
        return client.shutdown()
            .then(() => RC.terminateCluster(cluster.id));
    });

    it('appends one item', function () {
        return list.add(1).then(function () {
            return list.size();
        }).then(function (size) {
            expect(size).to.equal(1);
        });
    });

    it('inserts one item at index', function () {
        return list.addAll([1, 2, 3]).then(function () {
            return list.addAt(1, 5);
        }).then(function () {
            return list.toArray();
        }).then(function (all) {
            expect(all).to.deep.equal([1, 5, 2, 3]);
        });
    });

    it('clears', function () {
        return list.addAll([1, 2, 3]).then(function () {
            return list.clear();
        }).then(function () {
            return list.size();
        }).then(function (size) {
            expect(size).to.equal(0);
        });
    });

    it('inserts all elements of array at index', function () {
        return list.addAll([1, 2, 3]).then(function () {
            return list.addAllAt(1, [5, 6]);
        }).then(function () {
            return list.toArray();
        }).then(function (all) {
            expect(all).to.deep.equal([1, 5, 6, 2, 3])
        });
    });

    it('gets item at index', function () {
        const input = [1, 2, 3];
        return list.addAll(input).then(function () {
            return list.get(1);
        }).then(function (result) {
            expect(result).to.equal(2);
        });
    });

    it('removes item at index', function () {
        const input = [1, 2, 3];
        return list.addAll(input).then(function () {
            return list.removeAt(1);
        }).then(function (removed) {
            expect(removed).to.equal(2);
            return list.toArray();
        }).then(function (all) {
            expect(all).to.deep.equal([1, 3]);
        });
    });

    it('replaces item at index', function () {
        const input = [1, 2, 3];
        return list.addAll(input).then(function () {
            return list.set(1, 6);
        }).then(function (replaced) {
            expect(replaced).to.equal(2);
            return list.toArray();
        }).then(function (all) {
            expect(all).to.deep.equal([1, 6, 3]);
        });
    });

    it('contains', function () {
        const input = [1, 2, 3];
        return list.addAll(input).then(function () {
            return list.contains(1);
        }).then(function (contains) {
            expect(contains).to.be.true;
        });
    });

    it('does not contain', function () {
        const input = [1, 2, 3];
        return list.addAll(input).then(function () {
            return list.contains(5);
        }).then(function (contains) {
            expect(contains).to.be.false;
        });
    });

    it('contains all', function () {
        return list.addAll([1, 2, 3]).then(function () {
            return list.containsAll([1, 2]);
        }).then(function (contains) {
            expect(contains).to.be.true;
        });
    });

    it('does not contain all', function () {
        return list.addAll([1, 2, 3]).then(function () {
            return list.containsAll([3, 4]);
        }).then(function (contains) {
            expect(contains).to.be.false;
        });
    });

    it('is empty', function () {
        return list.isEmpty().then(function (empty) {
            expect(empty).to.be.true;
        });
    });

    it('is not empty', function () {
        return list.add(1).then(function (empty) {
            return list.isEmpty();
        }).then(function (empty) {
            expect(empty).to.be.false;
        });
    });

    it('removes an entry', function () {
        return list.addAll([1, 2, 3]).then(function () {
            return list.remove(1)
        }).then(function () {
            return list.toArray();
        }).then(function (all) {
            expect(all).to.deep.equal([2, 3]);
        });
    });

    it('removes an entry by index', function () {
        return list.addAll([1, 2, 3]).then(function () {
            return list.removeAt(1)
        }).then(function () {
            return list.toArray();
        }).then(function (all) {
            expect(all).to.deep.equal([1, 3]);
        });
    });

    it('removes multiple entries', function () {
        return list.addAll([1, 2, 3, 4]).then(function () {
            return list.removeAll([1, 2]);
        }).then(function () {
            return list.toArray();
        }).then(function (all) {
            expect(all).to.deep.equal([3, 4]);
        });
    });

    it('retains multiple entries', function () {
        return list.addAll([1, 2, 3, 4]).then(function () {
            return list.retainAll([1, 2]);
        }).then(function () {
            return list.toArray();
        }).then(function (all) {
            expect(all).to.deep.equal([1, 2]);
        });
    });

    it('finds index of the element', function () {
        return list.addAll([1, 2, 4, 4]).then(function () {
            return list.indexOf(4);
        }).then(function (index) {
            expect(index).to.equal(2);
        });
    });

    it('finds last index of the element', function () {
        return list.addAll([1, 2, 4, 4]).then(function () {
            return list.lastIndexOf(4);
        }).then(function (index) {
            expect(index).to.equal(3);
        });
    });

    it('returns a sub list', function () {
        return list.addAll([1, 2, 3, 4, 5, 6]).then(function () {
            return list.subList(1, 5);
        }).then(function (subList) {
            expect(subList.toArray()).to.deep.equal([2, 3, 4, 5]);
        });
    });

    it('listens for added entry', function (done) {
        const listener = {
            itemAdded: function (itemEvent) {
                expect(itemEvent.name).to.be.equal('test');
                expect(itemEvent.item).to.be.equal(1);
                expect(itemEvent.eventType).to.be.equal(ItemEventType.ADDED);
                expect(itemEvent.member).to.not.be.equal(null);
                done();
            }
        };
        list.addItemListener(listener, true).then(function () {
            list.add(1);
        }).catch(function (e) {
            done(e);
        });
    });

    it('listens for added and removed entry', function (done) {
        let added = false;
        const listener = {
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
        list.addItemListener(listener, true).then(function () {
            return list.add(2);
        }).then(function () {
            return list.remove(2);
        }).catch(function (e) {
            done(e);
        });
    });

    it('listens for removed entry with value included', function (done) {
        const listener = {
            itemRemoved: function (itemEvent) {
                expect(itemEvent.name).to.be.equal('test');
                expect(itemEvent.item).to.be.equal(1);
                expect(itemEvent.eventType).to.be.equal(ItemEventType.REMOVED);
                expect(itemEvent.member).to.not.be.equal(null);
                done();
            }
        };
        list.addItemListener(listener, true).then(function () {
            return list.add(1);
        }).then(function () {
            return list.remove(1);
        }).catch(function (e) {
            done(e);
        });
    });

    it('listens for removed entry with value not included', function (done) {
        const listener = {
            itemRemoved: function (itemEvent) {
                expect(itemEvent.name).to.be.equal('test');
                expect(itemEvent.item).to.be.equal(null);
                expect(itemEvent.eventType).to.be.equal(ItemEventType.REMOVED);
                expect(itemEvent.member).to.not.be.equal(null);
                done();
            }
        };
        list.addItemListener(listener, false).then(function () {
            return list.add(1);
        }).then(function () {
            return list.remove(1);
        }).catch(function (e) {
            done(e);
        });
    });

    it('remove entry listener', function (done) {
        list.addItemListener({
            itemRemoved: function () {
                done(new Error('Listener should not be triggered'));
            }
        }).then(function (registrationId) {
            return list.removeItemListener(registrationId);
        }).then(function (removed) {
            expect(removed).to.be.true;
            return list.add(1);
        }).then(function () {
            return list.remove(1);
        }).then(function () {
            setTimeout(done, 1000);
        }).catch(function (e) {
            done(e);
        });
    });
});
