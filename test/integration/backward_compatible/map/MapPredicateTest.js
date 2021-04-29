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

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = require('assert');
const fs = require('fs');

const RC = require('../../RC');
const { Client, Predicates } = require('../../../../');
const identifiedFactory = require('../../javaclasses/IdentifiedFactory');
const CustomComparator = require('../../javaclasses/CustomComparator');

describe('MapPredicateTest', function () {

    let cluster;
    let client;
    let map;

    function createReverseValueComparator() {
        return new CustomComparator(1, Predicates.IterationType.ENTRY);
    }

    before(async function () {
        cluster = await RC.createCluster(null, fs.readFileSync(__dirname + '/hazelcast_identifiedfactory.xml', 'utf8'));
        await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            serialization: {
                dataSerializableFactories: {
                    66: identifiedFactory
                }
            }
        });
    });

    beforeEach(async function () {
        map = await client.getMap('test');
        return fillMap();
    });

    afterEach(async function () {
        return map.destroy();
    });

    after(async function () {
        await client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    async function fillMap(size) {
        if (size === undefined) {
            size = 50;
        }
        const promises = [];
        for (let i = 0; i < size; i++) {
            promises.push(map.put('key' + i, i));
        }
        return Promise.all(promises);
    }

    async function testPredicate(predicate, expecteds, orderMatters) {
        const values = await map.valuesWithPredicate(predicate);
        if (orderMatters) {
            return expect(values.toArray()).to.deep.equal(expecteds);
        } else {
            return expect(values.toArray()).to.have.members(expecteds);
        }
    }

    it('Sql', async function () {
        return testPredicate(Predicates.sql('this == 10'), [10]);
    });

    it('And', async function () {
        return testPredicate(Predicates.and(Predicates.equal('this', 10), Predicates.equal('this', 11)), []);
    });

    it('GreaterThan', async function () {
        return testPredicate(Predicates.greaterThan('this', 47), [48, 49]);
    });

    it('GreaterEqual', async function () {
        return testPredicate(Predicates.greaterEqual('this', 47), [47, 48, 49]);
    });

    it('LessThan', async function () {
        return testPredicate(Predicates.lessThan('this', 4), [0, 1, 2, 3]);
    });

    it('LessEqual', async function () {
        return testPredicate(Predicates.lessEqual('this', 4), [0, 1, 2, 3, 4]);
    });

    it('Like', async function () {
        const localMap = await client.getMap('likePredMap');
        await localMap.put('temp', 'tempval');
        const values = await localMap.valuesWithPredicate(Predicates.like('this', 'tempv%'));
        expect(values.toArray()).to.have.members(['tempval']);
        return localMap.destroy();
    });

    it('ILike', async function () {
        const localMap = await client.getMap('likePredMap');
        await localMap.putAll([['temp', 'tempval'], ['TEMP', 'TEMPVAL']]);
        const values = await localMap.valuesWithPredicate(Predicates.ilike('this', 'tempv%'));
        expect(values.toArray()).to.have.members(['tempval', 'TEMPVAL']);
        return localMap.destroy();
    });

    it('In', async function () {
        return testPredicate(Predicates.inPredicate('this', 48, 49, 50, 51, 52), [48, 49]);
    });

    it('InstanceOf', async function () {
        const assertionList = Array.apply(null, { length: 50 }).map(Number.call, Number);
        return testPredicate(Predicates.instanceOf('java.lang.Double'), assertionList);
    });

    it('NotEqual', async function () {
        const assertionList = Array.apply(null, { length: 49 }).map(Number.call, Number);
        return testPredicate(Predicates.notEqual('this', 49), assertionList);
    });

    it('Not', async function () {
        return testPredicate(Predicates.not(Predicates.greaterEqual('this', 2)), [0, 1]);
    });

    it('Or', async function () {
        return testPredicate(
            Predicates.or(Predicates.greaterEqual('this', 49), Predicates.lessEqual('this', 0)),
            [0, 49]
        );
    });

    it('Between', async function () {
        return testPredicate(Predicates.between('this', 47, 49), [47, 48, 49]);
    });

    it('Null predicate throws error', async function () {
        return expect(testPredicate(null, null, [0, 49])).to.be.rejectedWith(assert.AssertionError);
    });

    it('Regex', async function () {
        const localMap = await client.getMap('regexMap');
        await localMap.putAll([['06', 'ankara'], ['07', 'antalya']]);
        const values = await localMap.valuesWithPredicate(Predicates.regex('this', '^.*ya$'));
        expect(values.toArray()).to.have.members(['antalya']);
        return localMap.destroy();
    });

    it('False', async function () {
        return testPredicate(Predicates.alwaysFalse(), []);
    });

    it('True', async function () {
        const assertionList = Array.apply(null, { length: 50 }).map(Number.call, Number);
        return testPredicate(Predicates.alwaysTrue(), assertionList);
    });

    it('Paging with reverse comparator should have elements in reverse order', async function () {
        const paging = Predicates.paging(Predicates.lessThan('this', 10), 3, createReverseValueComparator());
        return testPredicate(paging, [9, 8, 7], true);
    });

    it('Paging first page should have first two items', async function () {
        const paging = Predicates.paging(Predicates.greaterEqual('this', 40), 2);
        return testPredicate(paging, [40, 41]);
    });

    it('Paging nextPage should have 3rd and 4th items', async function () {
        const paging = Predicates.paging(Predicates.greaterEqual('this', 40), 2);
        paging.nextPage();

        return testPredicate(paging, [42, 43]);
    });

    it('Paging fourth page should have 7th and 8th items', async function () {
        const paging = Predicates.paging(Predicates.greaterEqual('this', 40), 2);
        paging.setPage(4);

        return testPredicate(paging, [48, 49]);
    });

    it('Paging #getPage should return approprate value', function () {
        const paging = Predicates.paging(Predicates.greaterEqual('this', 40), 2);
        paging.setPage(4);
        return expect(paging.getPage()).to.equal(4);
    });

    it('Paging #getPageSize should return 2', function () {
        const paging = Predicates.paging(Predicates.greaterEqual('this', 40), 2);
        return expect(paging.getPageSize()).to.equal(2);
    });

    it('Paging previousPage', async function () {
        const paging = Predicates.paging(Predicates.greaterEqual('this', 40), 2);
        paging.setPage(4);
        paging.previousPage();

        return testPredicate(paging, [46, 47]);
    });

    it('Get 4th page, then previous page', async function () {
        const paging = Predicates.paging(Predicates.greaterEqual('this', 40), 2);
        paging.setPage(4);
        await map.valuesWithPredicate(paging);
        paging.previousPage();
        return testPredicate(paging, [46, 47]);
    });

    it('Get 3rd page, then next page', async function () {
        const paging = Predicates.paging(Predicates.greaterEqual('this', 40), 2);
        paging.setPage(3);
        await map.valuesWithPredicate(paging);
        paging.nextPage();
        return testPredicate(paging, [48, 49]);
    });

    it('Get 10th page (which does not exist) should return empty list', async function () {
        const paging = Predicates.paging(Predicates.greaterEqual('this', 40), 2);
        paging.setPage(10);

        return testPredicate(paging, []);
    });

    it('Last page has only one element although page size is 2', async function () {
        const paging = Predicates.paging(Predicates.greaterEqual('this', 41), 2);
        paging.setPage(4);

        return testPredicate(paging, [49]);
    });

    it('There is no element satisfying paging predicate returns empty array', async function () {
        const paging = Predicates.paging(Predicates.lessThan('this', 0), 2);
        return testPredicate(paging, []);
    });

    it('Null inner predicate in PagingPredicate does not filter out items, only does paging', async function () {
        const paging = Predicates.paging(null, 2);
        return testPredicate(paging, [0, 1]);
    });
});
