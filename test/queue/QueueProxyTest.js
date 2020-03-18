/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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

var chai = require('chai');
var expect = chai.expect;
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var Controller = require('./../RC');
var Util = require('./../Util');
var Promise = require('bluebird');
var fs = require('fs');

var HazelcastClient = require('../../').Client;
var ItemEventType = require('../../').ItemEventType;

describe("Queue Proxy", function () {

    var cluster;
    var client;
    var queue;
    var serverConfig;

    before(function () {
        this.timeout(10000);
        return Controller.createCluster(null, fs.readFileSync(__dirname + '/hazelcast_queue.xml', 'utf8')).then(function (response) {
            cluster = response;
            return Controller.startMember(cluster.id);
        }).then(function () {
            return HazelcastClient.newHazelcastClient().then(function (hazelcastClient) {
                client = hazelcastClient;
            });
        });
    });

    beforeEach(function () {
        return client.getQueue('ClientQueueTest').then(function (q) {
            queue = q;
            return _offerToQueue(10);
        });
    });

    afterEach(function () {
        return queue.destroy();
    });

    function _offerToQueue(size, prefix) {
        if (prefix == null) {
            prefix = '';
        }
        var promises = [];
        for (var i = 0; i < size; i++) {
            promises.push(queue.offer(prefix + 'item' + i));
        }
        return Promise.all(promises);
    }

    after(function () {
        client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    it('size', function () {
        return queue.size().then(function (s) {
            return expect(s).to.equal(10);
        })
    });

    it('peek', function () {
        return queue.peek().then(function (head) {
            return expect(head).to.equal('item0');
        })
    });

    it('add return true', function () {
        return queue.add('item_new').then(function (retVal) {
            return expect(retVal).to.be.true;
        });
    });

    it('add increases queue size', function () {
        return queue.add('item_new').then(function () {
            return queue.size();
        }).then(function (s) {
            return expect(s).to.equal(11);
        });
    });

    it('add throws if queue is full', function () {
        return _offerToQueue(5, 'new').then(function () {
            return expect(queue.add('excess_item')).to.eventually.rejected;
        });
    });

    it('poll decreases queue size', function () {
        return queue.poll().then(function () {
            return queue.size();
        }).then(function (s) {
            return expect(s).to.equal(9);
        });
    });

    it('poll returns the head of the queue', function () {
        return queue.poll().then(function (ret) {
            return expect(ret).to.equal('item0');
        });
    });

    it('poll returns null after timeout', function () {
        return queue.clear().then(function () {
            return queue.poll(1000);
        }).then(function (ret) {
            return expect(ret).to.be.null;
        });
    });

    it('poll returns head after a new element added', function () {
        return queue.clear().then(function () {
            setTimeout(function () {
                queue.offer('new_item');
            }, 500);
            return queue.poll(1000);
        }).then(function (ret) {
            return expect(ret).to.equal('new_item');
        });
    });

    it('offer with timeout', function () {
        return queue.offer('new_item', 1000).then(function () {
            return queue.size();
        }).then(function (s) {
            return expect(s).to.equal(11);
        });
    });

    it('remaining capacity', function () {
        return queue.remainingCapacity().then(function (c) {
            return expect(c).to.equal(5);
        });
    });

    it('contains returns false for absent', function () {
        return queue.contains('item_absent').then(function (ret) {
            return expect(ret).to.be.false;
        });
    });

    it('contains returns true for present', function () {
        return queue.contains('item0').then(function (ret) {
            return expect(ret).to.be.true;
        });
    });

    it('remove', function () {
        return queue.remove('item5').then(function (ret) {
            return expect(ret).to.be.true;
        });
    });

    it('remove decreases size', function () {
        return queue.remove('item5').then(function () {
            return queue.size();
        }).then(function (s) {
            return expect(s).to.equal(9);
        });
    });

    it('toArray', function () {
        return queue.toArray().then(function (arr) {
            expect(arr).to.be.instanceof(Array);
            expect(arr).to.have.lengthOf(10);
            expect(arr).to.include.members(['item0', 'item2', 'item9']);
        });
    });

    it('clear', function () {
        return queue.clear().then(function () {
            return queue.size();
        }).then(function (s) {
            return expect(s).to.equal(0);
        });
    });

    it('drainTo', function () {
        var dummyArr = ['dummy_item'];
        return queue.drainTo(dummyArr).then(function () {
            expect(dummyArr).to.have.lengthOf(11);
            expect(dummyArr).to.include.members(['item0', 'dummy_item', 'item3', 'item9']);
        });
    });

    it('drainTo with max elements', function () {
        var dummyArr = ['dummy_item'];
        return queue.drainTo(dummyArr, 2).then(function () {
            expect(dummyArr).to.have.lengthOf(3);
            expect(dummyArr).to.include.members(['item0', 'dummy_item', 'item1']);
            expect(dummyArr).to.not.include.members(['item2', 'item9']);
        });
    });

    it('isEmpty false', function () {
        return queue.isEmpty().then(function (ret) {
            return expect(ret).to.be.false;
        });
    });

    it('isEmpty true', function () {
        return queue.clear().then(function (ret) {
            return queue.isEmpty();
        }).then(function (ret) {
            return expect(ret).to.be.true;
        })
    });

    it('take waits', function (done) {
        queue.clear().then(function () {
            queue.take().then(function (val) {
                expect(val).to.equal('item_new');
                done();
            }).catch(done);
            queue.add('item_new').catch(done);
        }).catch(done);
    });

    it('take immediately returns', function () {
        return queue.take().then(function (ret) {
            return expect(ret).to.equal('item0');
        });
    });

    it('addAll', function () {
        var values = ['a', 'b', 'c'];
        return queue.addAll(values).then(function (retVal) {
            expect(retVal).to.be.true;
            return queue.toArray();
        }).then(function (vals) {
            return expect(vals).to.include.members(values);
        })
    });

    it('containsAll true', function () {
        var values = ['item0', 'item1'];
        return queue.containsAll(values).then(function (ret) {
            return expect(ret).to.be.true;
        });
    });

    it('containsAll true', function () {
        var values = ['item0', 'item_absent'];
        return queue.containsAll(values).then(function (ret) {
            return expect(ret).to.be.false;
        });
    });

    it('containsAll true', function () {
        var values = [];
        return queue.containsAll(values).then(function (ret) {
            return expect(ret).to.be.true;
        });
    });

    it('put', function () {
        return queue.put('item_new').then(function () {
            return queue.size();
        }).then(function (s) {
            return expect(s).to.equal(11);
        });
    });

    it('removeAll', function () {
        var cand = ['item1', 'item2'];
        return queue.removeAll(cand).then(function (retVal) {
            return expect(retVal).to.be.true;
        }).then(function () {
            return queue.toArray();
        }).then(function (arr) {
            return expect(arr).to.not.include.members(cand);
        });
    });

    it('retainAll changes queue', function () {
        var retains = ['item1', 'item2'];
        return queue.retainAll(retains).then(function (r) {
            return expect(r).to.be.true;
        }).then(function () {
            return queue.toArray();
        }).then(function (arr) {
            return expect(arr).to.deep.equal(retains);
        });
    });


    it('retainAll does not change queue', function () {
        var retains;
        return queue.toArray().then(function (r) {
            retains = r;
            return queue.retainAll(r);
        }).then(function (r) {
            return expect(r).to.be.false;
        }).then(function () {
            return queue.toArray();
        }).then(function (arr) {
            return expect(arr).to.deep.equal(retains);
        });
    });

    it('addItemListener itemAdded', function (done) {
        queue.addItemListener({
            itemAdded: function (itemEvent) {
                expect(itemEvent.name).to.be.equal('ClientQueueTest');
                expect(itemEvent.item).to.be.equal('item_new');
                expect(itemEvent.eventType).to.be.equal(ItemEventType.ADDED);
                expect(itemEvent.member).to.not.be.equal(null);
                done();
            }
        }, true).then(function () {
            queue.add('item_new');
        })
    });

    it('addItemListener itemAdded with includeValue=false', function (done) {
        queue.addItemListener({
            itemAdded: function (itemEvent) {
                done();
            }
        }, false).then(function () {
            queue.add('item_new');
        });
    });


    it('addItemListener itemRemoved', function (done) {
        queue.addItemListener({
            itemRemoved: function (itemEvent) {
                expect(itemEvent.name).to.be.equal('ClientQueueTest');
                expect(itemEvent.item).to.be.equal('item0');
                expect(itemEvent.eventType).to.be.equal(ItemEventType.REMOVED);
                expect(itemEvent.member).to.not.be.equal(null);
                done();
            }
        }, true).then(function () {
            queue.remove('item0');
        });
    });

    it('removeItemListener', function () {
        return queue.addItemListener({}, false).then(function (regId) {
            return queue.removeItemListener(regId);
        }).then(function (ret) {
            return expect(ret).to.be.true;
        });
    });

    it('removeItemListener with wrong id returns null', function () {
        return queue.addItemListener({}, false).then(function () {
            return queue.removeItemListener('wrongId');
        }).then(function (ret) {
            return expect(ret).to.be.false;
        });
    });
});
