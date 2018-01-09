/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
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

var BuildMetadata = require('../lib/BuildMetadata').BuildMetadata;
var assert = require('chai').assert;

describe('BuildMetadata', function() {
    it('version calculation test', function() {
        assert.equal(-1, BuildMetadata.calculateVersion(null));
        assert.equal(-1, BuildMetadata.calculateVersion(""));
        assert.equal(-1, BuildMetadata.calculateVersion("a.3.7.5"));
        assert.equal(-1, BuildMetadata.calculateVersion("3.a.5"));
        assert.equal(-1, BuildMetadata.calculateVersion("3,7.5"));
        assert.equal(-1, BuildMetadata.calculateVersion("3.7,5"));
        assert.equal(-1, BuildMetadata.calculateVersion("10.99.RC1"));

        assert.equal(30700, BuildMetadata.calculateVersion("3.7"));
        assert.equal(30700, BuildMetadata.calculateVersion("3.7-SNAPSHOT"));
        assert.equal(30702, BuildMetadata.calculateVersion("3.7.2"));
        assert.equal(30702, BuildMetadata.calculateVersion("3.7.2-SNAPSHOT"));
        assert.equal(109902, BuildMetadata.calculateVersion("10.99.2-SNAPSHOT"));
        assert.equal(19930, BuildMetadata.calculateVersion("1.99.30"));
        assert.equal(109930, BuildMetadata.calculateVersion("10.99.30-SNAPSHOT"));
        assert.equal(109900, BuildMetadata.calculateVersion("10.99-RC1"));
    });
});
