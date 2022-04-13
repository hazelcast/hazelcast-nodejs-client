/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
const { AssertionError } = require('assert');
const {
    withoutDefaultGroupName,
    getObjectNameForProxy
} = require('../../../../lib/proxy/cpsubsystem/CPProxyManager');

describe('CPProxyManagerTest', function () {
    it('withoutDefaultGroupName: should remove default group from result', function () {
        expect(withoutDefaultGroupName('test@default')).to.be.equal('test');
        expect(withoutDefaultGroupName('test@custom')).to.be.equal('test@custom');
    });

    it('withoutDefaultGroupName: should throw for non-string', function () {
        expect(() => withoutDefaultGroupName(42)).to.throw(AssertionError);
    });

    it('withoutDefaultGroupName: should throw when group is specified multiple times', function () {
        expect(() => withoutDefaultGroupName('test@default@@default')).to.throw(AssertionError);
    });

    it('getObjectNameForProxy: should remove group from result', function () {
        expect(getObjectNameForProxy('test@default')).to.be.equal('test');
        expect(getObjectNameForProxy('test@custom')).to.be.equal('test');
    });

    it('getObjectNameForProxy: should throw for non-string', function () {
        expect(() => getObjectNameForProxy(42)).to.throw(AssertionError);
    });

    it('getObjectNameForProxy: should throw when object name is empty', function () {
        expect(() => getObjectNameForProxy('@default')).to.throw(AssertionError);
        expect(() => getObjectNameForProxy('  @default')).to.throw(AssertionError);
    });

    it('getObjectNameForProxy: should throw when group name is empty', function () {
        expect(() => getObjectNameForProxy('test@')).to.throw(AssertionError);
    });
});
