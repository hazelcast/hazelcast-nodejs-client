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
/* eslint-disable mocha/handle-done-callback */
'use strict';

const { expect } = require('chai');
const RC = require('../../RC');
const { Client } = require('../../../../');
const TestUtil = require('../../../TestUtil');

describe('MultiMap Proxy Listener', function () {

    let cluster;
    let client;
    let map;

    before(async function () {
        cluster = await RC.createCluster();
        await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({ clusterName: cluster.id });
    });

    beforeEach(async function () {
        map = await client.getMultiMap('test');
    });

    afterEach(async function () {
        return map.destroy();
    });

    after(async function () {
        await client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    function Listener(eventName,
                      doneCallback,
                      expectedName,
                      expectedKey,
                      expectedValue,
                      expectedOldValue,
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
        };
    }

    // Add tests

    it('listens for add with value excluded', function (done) {
        const listener = new Listener('added', done, 'test', 'foo', null, null, null);

        map.addEntryListener(listener, null, false).then(() => {
            map.put('foo', 'bar');
        });
    });

    it('listens for add with value included', function (done) {
        const listener = new Listener('added', done, 'test', 'foo', 'bar', null, null);

        map.addEntryListener(listener, null, true).then(() => {
            map.put('foo', 'bar');
        });
    });

    it('listens for add to specific key', function (done) {
        const listener = new Listener('added', done, 'test', 'foo', null, null, null);

        map.addEntryListener(listener, 'foo', false).then(() => {
            map.put('foo', 'bar');
        });
    });

    it('does not react to add on the wrong key', function (done) {
        const listener = {
            added: function () {
                done('Reacted to update on the wrong key');
            }
        };

        setTimeout(() => {
            done();
        }, 5000);

        map.addEntryListener(listener, 'xyz', false).then(() => {
            map.put('foo', 'bar');
        });
    });

    // Remove tests

    it('listens for remove with value excluded', function (done) {
        const listener = new Listener('removed', done, 'test', 'foo', null, null, null);

        map.addEntryListener(listener, null, false).then(() => {
            return map.put('foo', 'bar');
        }).then(() => {
            return map.remove('foo', 'bar');
        });
    });

    it('listens for remove with value included', function (done) {
        const listener = new Listener('removed', done, 'test', 'foo', null, 'bar', null);

        map.addEntryListener(listener, null, true).then(() => {
            return map.put('foo', 'bar');
        }).then(() => {
            return map.remove('foo', 'bar');
        });
    });

    it('listens for remove on specific key', function (done) {
        const listener = new Listener('added', done, 'test', 'foo', null, null, null);

        map.addEntryListener(listener, 'foo', false).then(() => {
            return map.put('foo', 'bar');
        }).then(() => {
            return map.remove('foo', 'bar');
        });
    });

    it('does not react to remove on the wrong key', function (done) {
        const listener = {
            added: function () {
                done('Reacted to update on the wrong key');
            }
        };

        setTimeout(() => {
            done();
        }, 5000);

        map.addEntryListener(listener, 'xyz', false).then(() => {
            return map.put('foo', 'bar');
        }).then(() => {
            return map.remove('foo', 'bar');
        });
    });

    // Other

    it('listens for clear', function (done) {
        const listener = {
            mapCleared: function (mapEvent) {
                try {
                    expect(mapEvent.name).to.be.equal('test');
                    expect(mapEvent.numberOfAffectedEntries).to.be.equal(1);
                    expect(mapEvent.member).to.not.be.equal(null);
                    done();
                } catch (err) {
                    done(err);
                }
            }
        };

        map.addEntryListener(listener, null, true).then(() => {
            return map.put('foo', 'bar');
        }).then(() => {
            return map.clear();
        });
    });

    it('removes present listener', async function () {
        const registrationId = await map.addEntryListener({}, null, true);
        const removed = await map.removeEntryListener(registrationId);
        expect(removed).to.be.true;
    });

    it('does nothing on remove non-present listener', async function () {
        const removed = await map.removeEntryListener('foo');
        expect(removed).to.be.false;
    });

    it('fires event for each pair of putAll', function (done) {
        TestUtil.markServerVersionAtLeast(this, client, '4.1');
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
            };
        };

        map.addEntryListener(listener('a', [1]), 'a')
            .then(() => map.addEntryListener(listener('b', [2, 22]), 'b'))
            .then(() => map.putAll([['a', [1]], ['b', [2, 22]]]));
    });
});
