/*
 * Copyright (c) 2008-2017, Hazelcast, Inc. All Rights Reserved.
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
var promiseLater = function (time, func) {
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                resolve(func());
            }, time);
        });
};
var expectAlmostEqual = function (actual, expected) {
    if (expected === null) {
        return expect(actual).to.equal(expected);
    }
    var typeExpected = typeof expected;
    if (typeExpected === 'number') {
        return expect(actual).to.be.closeTo(expected, 0.0001);
    }
    if (typeExpected === 'object') {
        return (function() {
            var membersEqual = true;
            for (var i in expected) {
                if (expectAlmostEqual(actual[i], expected[i])) {
                    membersEqual = false;
                    break;
                }
            }
            return membersEqual;
        })();
    }
    return expect(actual).to.equal(expected);
};

exports.fillMap = function (map, size, keyPrefix, valuePrefix) {
    if (size == void 0) {
        size = 10;
    }
    if (keyPrefix == void 0) {
        keyPrefix = 'key';
    }
    if (valuePrefix == void 0) {
        valuePrefix = 'val';
    }
    var entries = [];
    for (var i = 0; i < size; i++) {
        entries.push([keyPrefix + i, valuePrefix + i]);
    }
    return map.putAll(entries);
};

exports.markEnterprise = function (_this) {
    if(!process.env.HAZELCAST_ENTERPRISE_KEY){
        _this.skip();
    }
};

exports.promiseLater = promiseLater;
exports.expectAlmostEqual = expectAlmostEqual;
