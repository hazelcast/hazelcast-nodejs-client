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

const { expect } = require('chai');
const { copyBuffers } = require('../../lib/util/Util');

describe('UtilTest', function () {

    it('copyBuffers: throws on invalid total length', function () {
        expect(() => copyBuffers(Buffer.from([0x1]), [ Buffer.from([0x2]) ], 3))
            .to.throw(RangeError);
    });

    it('copyBuffers: writes single buffer of less length', function () {
        const target = Buffer.from('abc');
        const sources = [ Buffer.from('d') ];
        copyBuffers(target, sources, 1);

        expect(Buffer.compare(target, Buffer.from('dbc'))).to.be.equal(0);
    });

    it('copyBuffers: writes multiple buffers of same total length', function () {
        const target = Buffer.from('abc');
        const sources = [
            Buffer.from('d'),
            Buffer.from('e'),
            Buffer.from('f')
        ];
        copyBuffers(target, sources, 3);

        expect(Buffer.compare(target, Buffer.from('def'))).to.be.equal(0);
    });
});
