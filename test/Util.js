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
var BuildInfo = require('../lib/BuildInfo').BuildInfo;
var promiseLater = function (time, func) {
    if (func === undefined) {
        func = function () {
        };
    }
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
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
        return (function () {
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
    if (process.env.SERVER_TYPE === 'oss' || process.env.HZ_TYPE === 'oss') {
        _this.skip();
    }
    if (!process.env.HAZELCAST_ENTERPRISE_KEY) {
        _this.skip();
    }
};

exports.markServerVersionAtLeast = function (_this, client, expectedVersion) {
    if (process.env['SERVER_VERSION']) {
        var actNumber = BuildInfo.calculateServerVersionFromString(process.env['SERVER_VERSION']);
    } else if (client != null) {
        var actNumber = client.getClusterService().getOwnerConnection().getConnectedServerVersion();
    } else {
        return;
    }
    var expNumber = BuildInfo.calculateServerVersionFromString(expectedVersion);
    if (actNumber === BuildInfo.UNKNOWN_VERSION_ID || actNumber < expNumber) {
        _this.skip();
    }
};

exports.promiseWaitMilliseconds = function (milliseconds) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve();
        }, milliseconds);
    });
};

exports.getRandomInt = function (lowerLim, upperLim) {
    return Math.floor(Math.random() * (upperLim - lowerLim)) + lowerLim;
};

exports.findMemberByAddress = function (client, address) {
    return client.getClusterService().getMembers().find(function (m) {
        return m.address.equals(address);
    });
};

exports.promiseLater = promiseLater;
exports.expectAlmostEqual = expectAlmostEqual;
