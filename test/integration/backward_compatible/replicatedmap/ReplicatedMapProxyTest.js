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

const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const RC = require('./../../RC');
const { Client, Predicates } = require('../../../../');
const TestUtil = require('../../../TestUtil');

describe('ReplicatedMapProxyTest', function () {

    const ONE_HOUR = 3600000;

    let cluster;
    let client;
    let rm;

    before(async function () {
        const config = fs.readFileSync(path.join(__dirname, 'hazelcast_replicatedmap.xml'), 'utf8');
        cluster = await RC.createCluster(null, config);
        await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({ clusterName: cluster.id });
    });

    beforeEach(async function () {
        rm = await client.getReplicatedMap('test');
    });

    afterEach(async function () {
        return rm.destroy();
    });

    after(async function () {
        await client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    it('puts one entry and gets one entry', async function () {
        await rm.put('key', 'value', ONE_HOUR);
        const val = await rm.get('key');
        expect(val).to.equal('value');
    });

    it('puts entry with 0 ttl', async function () {
        await rm.put('zerottl', 'value');
        const val = await rm.get('zerottl');
        expect(val).to.equal('value');
    });

    it('puts entry with 1000 ttl', async function () {
        await rm.put('1000ttl', 'value', 1000);
        await TestUtil.promiseWaitMilliseconds(2000);
        const val = await rm.get('1000ttl');
        expect(val).to.be.null;
    });

    it('should contain the key', async function () {
        await rm.put('key', 'value', ONE_HOUR);
        const res = await rm.containsKey('key');
        expect(res).to.equal(true);
    });

    it('should not contain the key', async function () {
        const res = await rm.containsKey('key');
        expect(res).to.equal(false);
    });

    it('should contain the value', async function () {
        await rm.put('key', 'value', ONE_HOUR);
        const res = await rm.containsValue('value');
        expect(res).to.equal(true);
    });

    it('should not contain the value', async function () {
        const res = await rm.containsValue('value');
        expect(res).to.equal(false);
    });

    it('putting items into the map should increase it\'s size', async function () {
        await rm.put('key', 'value', ONE_HOUR);
        const size = await rm.size();
        expect(size).to.equal(1);
    });

    it('returns isEmpty true if map is empty', async function () {
        const res = await rm.isEmpty();
        expect(res).to.equal(true);
    });

    it('returns isEmpty false if map is not empty', async function () {
        await rm.put('key', 'value', ONE_HOUR);
        const res = await rm.isEmpty();
        expect(res).to.equal(false);
    });

    it('removes entry from map', async function () {
        await rm.put('key', 'value', ONE_HOUR);
        let contains = await rm.containsKey('key');
        expect(contains).to.equal(true);
        await rm.remove('key');
        contains = await rm.containsKey('key');
        expect(contains).to.equal(false);
    });

    it('clears map', async function () {
        await rm.put('key', 'value', ONE_HOUR);
        let size = await rm.size();
        expect(size).to.equal(1);
        await rm.clear();
        size = await rm.size();
        expect(size).to.equal(0);
    });

    it('returns entry set', async function () {
        await Promise.all([
            rm.put('key1', 'value1', ONE_HOUR),
            rm.put('key2', 'value2', ONE_HOUR),
            rm.put('key3', 'value3', ONE_HOUR)
        ]);
        const entrySet = await rm.entrySet();
        expect(entrySet).to.eql([
            ['key1', 'value1'],
            ['key2', 'value2'],
            ['key3', 'value3']
        ]);
    });

    it('batch put entries with putAll', async function () {
        await rm.putAll([
            ['key1', 'value1'],
            ['key2', 'value2'],
            ['key3', 'value3']
        ]);
        const entrySet = await rm.entrySet();
        expect(entrySet).to.eql([
            ['key1', 'value1'],
            ['key2', 'value2'],
            ['key3', 'value3']
        ]);
    });

    it('returns values array', async function () {
        await rm.putAll([
            ['key1', 'value1'],
            ['key2', 'value2'],
            ['key3', 'value3']
        ]);
        const values = await rm.values();
        expect(values.toArray()).to.eql(['value1', 'value2', 'value3']);
    });

    it('returns values array sorted with custom comparator', async function () {
        const expectedArray = ['value3', 'value2', 'value1'];
        await rm.putAll([
            ['key2', 'value2'],
            ['key3', 'value3'],
            ['key1', 'value1']
        ]);
        const values = await rm.values((a, b) => {
            return b[b.length - 1] - a[a.length - 1];
        });
        values.toArray().forEach((value, index) => {
            expect(value).to.equal(expectedArray[index]);
        });
    });

    it('returns keySet', async function () {
        await rm.putAll([
            ['key1', 'value1'],
            ['key2', 'value2'],
            ['key3', 'value3']
        ]);
        const values = await rm.keySet();
        expect(values).to.eql(['key1', 'key2', 'key3']);
    });

    it('addEntryListener should be fired on adding new key-value pair', function (done) {
        let registrationId;
        const listener = {
            added: function (entryEvent) {
                let error;
                try {
                    expect(entryEvent.name).to.equal('test');
                    expect(entryEvent.key).to.equal('new-key');
                    expect(entryEvent.value).to.equal('value');
                    expect(entryEvent.oldValue).to.be.equal(null);
                    expect(entryEvent.mergingValue).to.be.equal(null);
                    expect(entryEvent.member).to.not.be.equal(null);
                } catch (err) {
                    error = err;
                }

                rm.removeEntryListener(registrationId)
                    .then(() => {
                        done(error);
                    });
            }
        };

        rm.addEntryListener(listener)
            .then((listenerId) => {
                registrationId = listenerId;
                return rm.put('new-key', 'value', ONE_HOUR);
            });
    });

    it('addEntryListener listens to remove event', function (done) {
        let registrationId;
        const listener = {
            removed: function (entryEvent) {
                let error;
                try {
                    expect(entryEvent.name).to.equal('test');
                    expect(entryEvent.key).to.equal('key-to-remove');
                    expect(entryEvent.value).to.be.equal(null);
                    expect(entryEvent.oldValue).to.equal('value');
                    expect(entryEvent.mergingValue).to.be.equal(null);
                    expect(entryEvent.member).to.not.be.equal(null);
                } catch (err) {
                    error = err;
                }

                rm.removeEntryListener(registrationId)
                    .then(() => {
                        done(error);
                    });
            }
        };
        rm.addEntryListener(listener)
            .then((listenerId) => {
                registrationId = listenerId;
                return rm.put('key-to-remove', 'value', ONE_HOUR);
            })
            .then(() => {
                return rm.remove('key-to-remove');
            });
    });

    it('addEntryListener listens to updated event', function (done) {
        let registrationId;
        const listener = {
            updated: function (entryEvent) {
                let error;
                try {
                    expect(entryEvent.name).to.equal('test');
                    expect(entryEvent.key).to.equal('key-to-update');
                    expect(entryEvent.value).to.equal('value2');
                    expect(entryEvent.oldValue).to.equal('value1');
                    expect(entryEvent.mergingValue).to.be.equal(null);
                    expect(entryEvent.member).to.not.be.equal(null);
                } catch (err) {
                    error = err;
                }

                rm.removeEntryListener(registrationId)
                    .then(() => {
                        done(error);
                    });
            }
        };
        rm.addEntryListener(listener)
            .then((listenerId) => {
                registrationId = listenerId;
                return rm.put('key-to-update', 'value1', ONE_HOUR);
            })
            .then(() => {
                return rm.put('key-to-update', 'value2', ONE_HOUR);
            });
    });

    it('addEntryListener listens to clearedAll event', function (done) {
        let registrationId;
        const listener = {
            mapCleared: function (mapEvent) {
                let error;
                try {
                    expect(mapEvent.name).to.equal('test');
                    expect(mapEvent.numberOfAffectedEntries).to.equal(4);
                    expect(mapEvent.member).to.not.be.equal(null);
                } catch (err) {
                    error = err;
                }

                rm.removeEntryListener(registrationId)
                    .then(() => {
                        done(error);
                    });
            }
        };
        rm.addEntryListener(listener)
            .then((listenerId) => {
                registrationId = listenerId;
                return Promise.all([
                    rm.put('key-to-clear1', 'value1', ONE_HOUR),
                    rm.put('key-to-clear2', 'value2', ONE_HOUR),
                    rm.put('key-to-clear3', 'value2', ONE_HOUR),
                    rm.put('key-to-clear4', 'value2', ONE_HOUR)
                ]);
            })
            .then(() => {
                return rm.clear();
            });
    });

    it('addEntryListenerToKey should be fired only for selected key', function (done) {
        let listeners = [];
        const listener1 = {
            added: () => {
                done(new Error('This listener must not be fired'));
            }
        };
        const listener2 = {
            added: function (entryEvent) {
                let error;
                try {
                    expect(entryEvent.name).to.equal('test');
                    expect(entryEvent.key).to.equal('key1');
                    expect(entryEvent.value).to.equal('value');
                    expect(entryEvent.oldValue).to.be.equal(null);
                    expect(entryEvent.mergingValue).to.be.equal(null);
                    expect(entryEvent.member).to.not.be.equal(null);
                } catch (err) {
                    error = err;
                }

                Promise.all([
                    rm.removeEntryListener(listeners[0]),
                    rm.removeEntryListener(listeners[1])
                ])
                    .then(() => {
                        done(error);
                    });
            }
        };

        Promise.all([
            rm.addEntryListenerToKey(listener1, 'key'),
            rm.addEntryListenerToKey(listener2, 'key1')
        ])
            .then((res) => {
                listeners = res;
                return rm.put('key1', 'value', ONE_HOUR);
            });
    });

    it('addEntryListenerWithPredicate', function (done) {
        let listenerId;
        const listener = {
            added: function (entryEvent) {
                let error;
                try {
                    expect(entryEvent.name).to.equal('test');
                    expect(entryEvent.key).to.equal('key10');
                    expect(entryEvent.value).to.equal('val10');
                    expect(entryEvent.oldValue).to.be.equal(null);
                    expect(entryEvent.mergingValue).to.be.equal(null);
                    expect(entryEvent.member).to.not.be.equal(null);
                } catch (err) {
                    error = err;
                }
                rm.removeEntryListener(listenerId)
                    .then(() => {
                        done(error);
                    });

            }
        };
        rm.addEntryListenerWithPredicate(listener, Predicates.sql('this == val10'))
            .then((registrationId) => {
                listenerId = registrationId;
                return rm.put('key10', 'val10', ONE_HOUR);
            });
    });

    it('addEntryListenerToKeyWithPredicate', function (done) {
        let listenerId;
        const listenerObject = {
            added: function (entryEvent) {
                let error;
                try {
                    expect(entryEvent.name).to.equal('test');
                    expect(entryEvent.key).to.equal('key');
                    expect(entryEvent.value).to.be.equal('value');
                    expect(entryEvent.oldValue).to.be.equal(null);
                    expect(entryEvent.mergingValue).to.be.equal(null);
                    expect(entryEvent.member).to.not.be.equal(null);

                } catch (err) {
                    error = err;
                }

                rm.removeEntryListener(listenerId)
                    .then(() => {
                        done(error);
                    });
            }
        };
        rm.addEntryListenerToKeyWithPredicate(listenerObject, 'key', Predicates.sql('this == value'))
            .then((registrationId) => {
                listenerId = registrationId;
                return rm.put('key', 'value', ONE_HOUR);
            });
    });
});
