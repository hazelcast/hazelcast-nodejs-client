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
const RC = require('../../RC');
const { Client } = require('../../../');
const { Musician, MusicianSerializer } = require('./Musician');

describe('CustomSerializerConfigTest', function () {

    let cluster;
    let client;

    before(function () {
        return RC.createCluster(null, null).then(function (cl) {
            cluster = cl;
            return RC.startMember(cluster.id);
        });
    });

    after(function () {
        client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    function createConfig(clusterName) {
        return {
            clusterName,
            serialization: {
                customSerializers: [new MusicianSerializer()]
            }
        };
    }

    it('should be configured programmatically', function () {
        const musician = new Musician('Furkan');
        return Client.newHazelcastClient(createConfig(cluster.id))
            .then(function (cl) {
                client = cl;
                expect(client.getSerializationService().findSerializerFor(musician).id).to.be.equal(10);
                let map;
                return client.getMap('musicians').then(function (mp) {
                    map = mp;
                    return map.put('neyzen', musician);
                }).then(function () {
                    return map.get('neyzen');
                }).then(function (res) {
                    expect(res.name).to.be.equal('Furkan');
                });
            });
    });
});
