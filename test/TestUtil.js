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

exports.promiseLater = function (time, func) {
    if (func === undefined) {
        func = () => {};
    }
    return new Promise(((resolve) => {
        setTimeout(() => {
            resolve(func());
        }, time);
    }));
};

/**
 * Returns rejection reason if rejected, otherwise throws an error.
 */
exports.getRejectionReasonOrThrow = async function (asyncFn) {
    try {
        await asyncFn();
    } catch (e) {
        return e;
    }
    throw new Error('Expected the call the throw, but it didn\'t.');
};

/**
 * Returns thrown error if thrown, otherwise throws an error.
 */
exports.getThrownErrorOrThrow = function (fn) {
    try {
        fn();
    } catch (e) {
        return e;
    }
    throw new Error('Expected the call the throw, but it didn\'t.');
};

exports.promiseWaitMilliseconds = function (milliseconds) {
    return new Promise(((resolve) => {
        setTimeout(() => {
            resolve();
        }, milliseconds);
    }));
};

exports.assertTrueEventually = function (taskAsyncFn, intervalMs = 100, timeoutMs = 60000) {
    return new Promise(((resolve, reject) => {
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
    }));
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

exports.getRandomConnection = function(client) {
    if (Object.prototype.hasOwnProperty.call(client, 'connectionRegistry')) {
        return client.connectionRegistry.getRandomConnection();
    } else {
        return client.getConnectionManager().getRandomConnection();
    }
};

exports.getConnections = function(client) {
    if (Object.prototype.hasOwnProperty.call(client, 'connectionRegistry')) {
        return client.connectionRegistry.getConnections();
    } else {
        return client.getConnectionManager().getActiveConnections();
    }
};

/**
 * @param client Client instance
 * @param registrationId Registration id of the listener as a string
 * @returns a Map<Connection, ConnectionRegistration> in 5.1 and above,
 * a Map<ClientConnection, ClientEventRegistration> before 5.1
 */
exports.getActiveRegistrations = function(client, registrationId) {
    const listenerService = client.getListenerService();
    if (exports.isClientVersionAtLeast('5.1')) {
        const registration = listenerService.registrations.get(registrationId);
        if (registration === undefined) {
            return new Map();
        }
        return registration.connectionRegistrations;
    } else {
        const registrationMap = listenerService.activeRegistrations.get(registrationId);
        if (registrationMap === undefined) {
            return new Map();
        }
        return registrationMap;
    }
};

exports.isServerVersionAtLeast = function(client, version) {
    let actual = BuildInfo.UNKNOWN_VERSION_ID;
    if (process.env['SERVER_VERSION']) {
        actual = BuildInfo.calculateServerVersionFromString(process.env['SERVER_VERSION']);
    } else if (client != null) {
        actual = exports.getRandomConnection(client).getConnectedServerVersion();
    }
    const expected = BuildInfo.calculateServerVersionFromString(version);
    return actual === BuildInfo.UNKNOWN_VERSION_ID || expected <= actual;
};

exports.isClientVersionAtLeast = function(version) {
    const actual = BuildInfo.calculateServerVersionFromString(BuildInfo.getClientVersion());
    const expected = BuildInfo.calculateServerVersionFromString(version);
    return actual === BuildInfo.UNKNOWN_VERSION_ID || expected <= actual;
};

exports.markServerVersionAtLeast = function (_this, client, expectedVersion) {
    if (!exports.isServerVersionAtLeast(client, expectedVersion)) {
        _this.skip();
    }
};

exports.markClientVersionAtLeast = function(_this, expectedVersion) {
    if (!exports.isClientVersionAtLeast(expectedVersion)) {
        _this.skip();
    }
};

exports.getRandomInt = function (lowerLim, upperLim) {
    return Math.floor(Math.random() * (upperLim - lowerLim)) + lowerLim;
};

exports.randomString = function (length) {
    const result = [];
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
    }
    return result.join('');
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

exports.readStringFromReader = function (reader, fieldName) {
    if (typeof reader.readString === 'function') {
        return reader.readString(fieldName);
    } else {
        return reader.readUTF(fieldName);
    }
};

exports.readStringFromInput = function (input) {
    if (typeof input.readString === 'function') {
        return input.readString();
    } else {
        return input.readUTF();
    }
};

exports.writeStringToWriter = function (writer, fieldName, value) {
    if (typeof writer.writeString === 'function') {
        writer.writeString(fieldName, value);
    } else {
        writer.writeUTF(fieldName, value);
    }
};

exports.writeStringToOutput = function (output, value) {
    if (typeof output.writeString === 'function') {
        output.writeString(value);
    } else {
        output.writeUTF(value);
    }
};
