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
const LazyReadResultSet = require('../../lib/proxy/ringbuffer/LazyReadResultSet').LazyReadResultSet;
const Errors = require('../..').HazelcastErrors;

describe('LazyReadResultSetTest', function () {

    const mockSerializationService = {
        toObject: (x) => x + 100,
        isData: (x) => x < 3
    };

    it('get', function () {
        const set = new LazyReadResultSet(mockSerializationService, 4, [1, 2, 3, 4], [11, 12, 13, 14], 15);
        expect(set.get(0)).to.equal(101);
        expect(set.get(1)).to.equal(102);
        expect(set.get(2)).to.equal(3);
        expect(set.get(3)).to.equal(4);
        expect(set.getSequence(0)).to.equal(11);
        expect(set.getSequence(1)).to.equal(12);
        expect(set.getSequence(2)).to.equal(13);
        expect(set.getSequence(3)).to.equal(14);
        expect(set.getReadCount()).to.equal(4);
        expect(set.getNextSequenceToReadFrom()).to.equal(15);
    });

    it('get returns undefined for out of range index', function () {
        const set = new LazyReadResultSet(mockSerializationService, 4, [1, 2, 3, 4], [11, 12, 13, 14], 15);
        expect(set.get(4)).to.be.undefined;
    });
});
