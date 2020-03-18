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

var expect = require('chai').expect;
var LazyReadResultSet = require('../../lib/proxy/ringbuffer/LazyReadResultSet').LazyReadResultSet;
var HzErrors = require('../..').HazelcastErrors;

describe('LazyReadResultSetTest', function () {

    var mockSerializationService = {
        'toObject': function (x) {
            return x + 100;
        },

        'isData': function (x) {
            return x < 3;
        }
    };

    it('get', function () {
        var set = new LazyReadResultSet(mockSerializationService, 4, [1, 2, 3, 4], [11, 12, 13, 14]);
        expect(set.get(0)).to.equal(101);
        expect(set.get(1)).to.equal(102);
        expect(set.get(2)).to.equal(3);
        expect(set.get(3)).to.equal(4);
        expect(set.getSequence(0)).to.equal(11);
        expect(set.getSequence(1)).to.equal(12);
        expect(set.getSequence(2)).to.equal(13);
        expect(set.getSequence(3)).to.equal(14);
        expect(set.getReadCount()).to.equal(4);
    });

    it('getSequence throws UnsupportedOperationError when there is no info', function () {
        var set = new LazyReadResultSet(mockSerializationService, 4, [1, 2, 3, 4]);
        expect(set.getSequence.bind(set, 2)).to.throw(HzErrors.UnsupportedOperationError);
    });

    it('get returns undefined for out of range index', function () {
        var set = new LazyReadResultSet(mockSerializationService, 4, [1, 2, 3, 4], [11, 12, 13, 14]);
        expect(set.get(4)).to.be.undefined;
    });
});
