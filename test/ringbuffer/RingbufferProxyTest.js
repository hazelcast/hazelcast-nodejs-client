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
'use strict';

const expect = require('chai').expect;
const Promise = require('bluebird');
const fs = require('fs');
const RC = require('./../RC');
const { Client } = require('../../');
const PrefixFilter = require('../javaclasses/PrefixFilter');

describe('RingbufferProxyTest', function () {

    let cluster;
    let client;
    let rb;

    before(function () {
        this.timeout(10000);
        const config = fs.readFileSync(__dirname + '/hazelcast_ringbuffer.xml', 'utf8');
        return RC.createCluster(null, config).then(function (response) {
            cluster = response;
            return RC.startMember(cluster.id);
        }).then(function () {
            return Client.newHazelcastClient({ clusterName: cluster.id });
        }).then(function (hazelcastClient) {
            client = hazelcastClient;
        });
    });

    beforeEach(function () {
        return client.getRingbuffer('test').then(function (buffer) {
            rb = buffer;
        })
    });

    afterEach(function () {
        return rb.destroy();
    });

    after(function () {
        client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    it('adds one item and reads back', function () {
        return rb.add(1).then(function (sequence) {
            return rb.readOne(sequence).then(function (item) {
                expect(item).to.equal(1);
            });
        })
    });

    it('adds multiple items and reads them back one by one', function () {
        return rb.addAll([1, 2, 3]).then(function () {
            return Promise.all([
                rb.readOne(0), rb.readOne(1), rb.readOne(2)
            ]).then(function (items) {
                expect(items).to.deep.equal([1, 2, 3]);
            });
        })
    });

    it('reads all items at once', function () {
        return rb.addAll([1, 2, 3]).then(function () {
            return rb.readMany(0, 1, 3).then(function (items) {
                expect(items.get(0)).to.equal(1);
                expect(items.get(1)).to.equal(2);
                expect(items.get(2)).to.equal(3);
                expect(items.getReadCount()).to.equal(3);
            });
        })
    });

    it('readMany with filter filters the results', function () {
        return rb.addAll(['item1', 'prefixedItem2', 'prefixedItem3']).then(function () {
            return rb.readMany(0, 1, 3, new PrefixFilter('prefixed')).then(function (items) {
                expect(items.get(0)).to.equal('prefixedItem2');
                expect(items.get(1)).to.equal('prefixedItem3');
            });
        })
    });

    it('correctly reports tail sequence', function () {
        return rb.addAll([1, 2, 3]).then(function () {
            return rb.tailSequence().then(function (sequence) {
                expect(sequence.toNumber()).to.equal(2);
            });
        })
    });

    it('correctly reports head sequence', function () {
        let limitedCapacity;
        return client.getRingbuffer('capacity').then(function (buffer) {
            limitedCapacity = buffer;
            return limitedCapacity.addAll([1, 2, 3, 4, 5]);
        }).then(function () {
            return limitedCapacity.headSequence().then(function (sequence) {
                expect(sequence.toNumber()).to.equal(2);
            });
        })
    });

    it('correctly reports remaining capacity', function () {
        let ttl = client.getRingbuffer('ttl-cap').then(function (buffer) {
            ttl = buffer;
            return ttl.addAll([1, 2]);
        }).then(function () {
            return ttl.remainingCapacity().then(function (rc) {
                expect(rc.toNumber()).to.equal(3);
            });
        })
    });

    it('correctly reports total capacity', function () {
        return client.getRingbuffer('ttl-cap').then(function (buffer) {
            return buffer.capacity();
        }).then(function (capacity) {
            expect(capacity.toNumber()).to.equal(5);
        });
    });

    it('correctly reports size', function () {
        return rb.addAll([1, 2]).then(function () {
            return rb.size().then(function (size) {
                expect(size.toNumber()).to.equal(2);
            });
        })
    });
});
