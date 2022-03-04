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
const { BuildInfo } = require('../lib/BuildInfo');
const { UuidUtil } = require('../lib/util/UuidUtil');

exports.promiseLater = function (time, func) {
    if (func === undefined) {
        func = () => {};
    }
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(func());
        }, time);
    });
};

exports.promiseWaitMilliseconds = function (milliseconds) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve();
        }, milliseconds);
    });
};

exports.assertTrueEventually = function (taskAsyncFn, intervalMs = 100, timeoutMs = 60000) {
    return new Promise(function (resolve, reject) {
        let intervalTimer;
        function scheduleNext() {
            intervalTimer = setTimeout(() => {
                taskAsyncFn()
                    .then(() => {
                        clearInterval(timeoutTimer);
                        resolve();
                    })
                    .catch(() => {
                        scheduleNext();
                    });
            }, intervalMs);
        }
        scheduleNext();

        const timeoutTimer = setTimeout(() => {
            clearInterval(intervalTimer);
            reject(new Error('Rejected due to timeout of ' + timeoutMs + 'ms'));
        }, timeoutMs);
    });
};

const expectAlmostEqual = function (actual, expected) {
    if (expected === null) {
        return expect(actual).to.equal(expected);
    }
    const typeExpected = typeof expected;
    if (typeExpected === 'number') {
        return expect(actual).to.be.closeTo(expected, 0.0001);
    }
    if (typeExpected === 'object') {
        return (function () {
            let membersEqual = true;
            for (const i in expected) {
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
exports.expectAlmostEqual = expectAlmostEqual;

exports.fillMap = function (map, size, keyPrefix, valuePrefix) {
    if (size === undefined) {
        size = 10;
    }
    if (keyPrefix === undefined) {
        keyPrefix = 'key';
    }
    if (valuePrefix === undefined) {
        valuePrefix = 'val';
    }
    const entries = [];
    for (let i = 0; i < size; i++) {
        entries.push([keyPrefix + i, valuePrefix + i]);
    }
    return map.putAll(entries);
};

exports.markCommunity = function (_this) {
    // the following two env vars are set in compat test suite
    if (process.env.SERVER_TYPE === 'enterprise' || process.env.HZ_TYPE === 'enterprise') {
        _this.skip();
    }

    if (process.env.HAZELCAST_ENTERPRISE_KEY) {
        _this.skip();
    }
};

exports.markEnterprise = function (_this) {
    // the following two env vars are set in compat test suite
    if (process.env.SERVER_TYPE === 'oss' || process.env.HZ_TYPE === 'oss') {
        _this.skip();
    }

    if (!process.env.HAZELCAST_ENTERPRISE_KEY) {
        _this.skip();
    }
};

/**
 * Duplicated this from BuildInfo because the logic of it is changed in 5.1, and in backward compatibility tests older
 * versions won't be able to access the new logic if we keep the new logic only in src/.
 */
 exports.calculateServerVersionFromString = (versionString) => {
    if (versionString == null) {
        return BuildInfo.UNKNOWN_VERSION_ID;
    }
    const mainParts = versionString.split('-');
    const tokens = mainParts[0].split('.');

    if (tokens.length < 2) {
        return BuildInfo.UNKNOWN_VERSION_ID;
    }

    const major = +tokens[0];
    const minor = +tokens[1];
    const patch = (tokens.length === 2) ? 0 : +tokens[2];

    const version = BuildInfo.MAJOR_VERSION_MULTIPLIER * major + BuildInfo.MINOR_VERSION_MULTIPLIER * minor + patch;

    // version is NaN when one of major, minor and patch is not a number.
    return isNaN(version) ? BuildInfo.UNKNOWN_VERSION_ID : version;
};

exports.isClientVersionAtLeast = function(version) {
    const actual = exports.calculateServerVersionFromString(BuildInfo.getClientVersion());
    const expected = exports.calculateServerVersionFromString(version);
    return actual === BuildInfo.UNKNOWN_VERSION_ID || expected <= actual;
};

exports.markServerVersionAtLeast = function (_this, client, expectedVersion) {
    let actNumber;
    if (process.env['SERVER_VERSION']) {
        actNumber = BuildInfo.calculateServerVersionFromString(process.env['SERVER_VERSION']);
    } else if (client != null) {
        actNumber = client.getConnectionManager().getRandomConnection().getConnectedServerVersion();
    } else {
        return;
    }
    const expNumber = BuildInfo.calculateServerVersionFromString(expectedVersion);
    if (actNumber === BuildInfo.UNKNOWN_VERSION_ID || actNumber < expNumber) {
        _this.skip();
    }
};

exports.getRandomInt = function (lowerLim, upperLim) {
    return Math.floor(Math.random() * (upperLim - lowerLim)) + lowerLim;
};

exports.randomString = function () {
    return UuidUtil.generate().toString();
};

class CountingMembershipListener {

    constructor(expectedAdds, expectedRemoves) {
        this.adds = 0;
        this.expectedAdds = expectedAdds;
        this.removes = 0;
        this.expectedRemoves = expectedRemoves;
        this.expectedPromise = new Promise((resolve) => {
            this._resolve = resolve;
        });
    }

    memberAdded() {
        this.adds++;
        this.checkCounts();
    }

    memberRemoved() {
        this.removes++;
        this.checkCounts();
    }

    checkCounts() {
        if (this.adds < this.expectedAdds) {
            return;
        }
        if (this.removes < this.expectedRemoves) {
            return;
        }
        this._resolve();
    }

}

exports.CountingMembershipListener = CountingMembershipListener;
