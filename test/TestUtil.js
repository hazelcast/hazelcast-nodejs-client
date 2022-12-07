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
const { BuildInfo } = require('../lib/BuildInfo');
const { Lang } = require('./integration/remote_controller/remote_controller_types');
const { Client } = require('..');
const RC = require('./integration/RC');

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
    throw new Error('Expected the call to throw, but it didn\'t.');
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
    throw new Error('Expected the call to throw, but it didn\'t.');
};

exports.promiseWaitMilliseconds = function (milliseconds) {
    return new Promise(((resolve) => {
        setTimeout(() => {
            resolve();
        }, milliseconds);
    }));
};

exports.assertTrueEventually = function (taskAsyncFn, intervalMs = 100, timeoutMs = 60000) {
    const errorsToCount = {};
    return new Promise(((resolve, reject) => {
        let intervalTimer;
        function scheduleNext() {
            intervalTimer = setTimeout(() => {
                taskAsyncFn()
                    .then(() => {
                        clearInterval(timeoutTimer);
                        resolve();
                    })
                    .catch(e => {
                        if (e.stack in errorsToCount) {
                            errorsToCount[e.stack]++;
                        } else {
                            errorsToCount[e.stack] = 1;
                        }
                        scheduleNext();
                    });
            }, intervalMs);
        }
        scheduleNext();

        const timeoutTimer = setTimeout(() => {
            clearInterval(intervalTimer);

            let errorString = '';
            for (const error in errorsToCount) {
                errorString += `\tThe following error occurred ${errorsToCount[error]} times:\n\n\t${error} \n\n`;
            }

            reject(new Error(`Rejected due to timeout of ${timeoutMs}ms. `
            + `The following are the errors that occurred and their counts: \n\n${errorString}`));
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

exports.fillMap = function (map, size = 10, keyPrefix = 'key', valuePrefix = 'val') {
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
        actual = exports.calculateServerVersionFromString(process.env['SERVER_VERSION']);
    } else if (client != null) {
        actual = exports.getRandomConnection(client).getConnectedServerVersion();
    }
    const expected = exports.calculateServerVersionFromString(version);
    return actual === BuildInfo.UNKNOWN_VERSION_ID || expected <= actual;
};

/**
 * Returns
 * - 0 if they are equal
 * - positive number if server version is newer than the version
 * - negative number if server version is older than the version
 */
exports.compareServerVersionWithRC = async function (rc, version) {
    const script = 'result=com.hazelcast.instance.GeneratedBuildProperties.VERSION;';
    const result = await rc.executeOnController(null, script, Lang.JAVASCRIPT);

    const rcServerVersion = exports.calculateServerVersionFromString(result.result.toString());
    const comparedVersion = exports.calculateServerVersionFromString(version);

    return rcServerVersion - comparedVersion;
};

exports.isClientVersionAtLeast = function(version) {
    const actual = exports.calculateServerVersionFromString(BuildInfo.getClientVersion());
    const expected = exports.calculateServerVersionFromString(version);
    return actual === BuildInfo.UNKNOWN_VERSION_ID || expected <= actual;
};

exports.isClientVersionAtMost = function(version) {
    const actual = exports.calculateServerVersionFromString(BuildInfo.getClientVersion());
    const expected = exports.calculateServerVersionFromString(version);
    return actual === BuildInfo.UNKNOWN_VERSION_ID || expected >= actual;
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

// functions for backward compatibility
exports.getSql = function (client) {
    if (exports.isClientVersionAtLeast('5.0')) {
        return client.getSql();
    } else {
        return client.getSqlService();
    }
};

exports.getSqlColumnType = function () {
    const { SqlColumnType } = require('../lib/sql/SqlColumnMetadata');
    return SqlColumnType;
};

exports.getDateTimeUtil = function () {
    // Renamed in 5.0
    if (exports.isClientVersionAtLeast('5.0')) {
        return require('../lib/util/DateTimeUtil');
    } else {
        return require('../lib/util/DatetimeUtil');
    }
};

exports.getOffsetDateTime = function() {
    const { OffsetDateTime } = require('..');
    return OffsetDateTime;
};

exports.getLocalDateTime = function() {
    const { LocalDateTime } = require('..');
    return LocalDateTime;
};

exports.getLocalDate = function() {
    const { LocalDate } = require('..');
    return LocalDate;
};

exports.getLocalTime = function() {
    const { LocalTime } = require('..');
    return LocalTime;
};

exports.getBigDecimal = function() {
    const { BigDecimal } = require('..');
    return BigDecimal;
};

/**
 * Creates mapping for SQL queries. In 5.0, users started to write explicit mapping for SQL queries against maps.
 * @param serverVersionNewerThanFive True if server is newer than version five
 * @param client Hazelcast client object
 * @param keyFormat SQL column type of map key, case insensitive
 * @param valueFormat SQL column type of map value, case insensitive
 * @param mapName Name of the map
 */
exports.createMapping = async (serverVersionNewerThanFive, client, keyFormat, valueFormat, mapName) => {
    if (!serverVersionNewerThanFive) {
        // Before 5.0, mappings are created implicitly, thus we don't need to create explicitly.
        return;
    }
    const createMappingQuery = `
            CREATE MAPPING ${mapName} (
                __key ${keyFormat.toUpperCase()},
                this ${valueFormat.toUpperCase()}
            )
            TYPE IMAP
            OPTIONS (
                'keyFormat' = '${keyFormat.toLowerCase()}',
                'valueFormat' = '${valueFormat.toLowerCase()}'
            )
        `;

    const result = await exports.getSql(client).execute(createMappingQuery);
    // Wait for execution to end.
    if (!exports.isClientVersionAtLeast('5.0')) {
        await result.getUpdateCount();
    }
};

/**
 * Creates portable mapping for SQL queries. In 5.0, users started to write explicit mapping for SQL queries against maps.
 * @param keyFormat Key format
 * @param factoryId Portable's factory id
 * @param classId Portable's class id
 * @param columns Columns as a dict where keys are column names, and values are case insensitive value formats.
 * @param client Client instance
 * @param mapName Map name
 * @param serverVersionNewerThanFive true if server version >= 5.0
 */
exports.createMappingForPortable = async (
    keyFormat, factoryId, classId, columns, client, mapName, serverVersionNewerThanFive
) => {
    if (!serverVersionNewerThanFive) {
        // Before 5.0, mappings are created implicitly, thus we don't need to create explicitly.
        return;
    }

    const columnsString = Object.entries(columns).map(column => `${column[0]} ${column[1].toUpperCase()}`).join(',\n');

    const createMappingQuery = `
            CREATE MAPPING ${mapName} (
                __key ${keyFormat}${Object.keys(columns).length > 0 ? ',' : ''}
                ${columnsString}
            )
            TYPE IMaP
            OPTIONS (
                'keyFormat' = '${keyFormat}',
                'valueFormat' = 'portable',
                'valuePortableFactoryId' = '${factoryId}',
                'valuePortableClassId' = '${classId}'
            )
        `;

    await exports.getSql(client).execute(createMappingQuery);
};

/**
 * Creates portable mapping for SQL queries. In 5.0, users started to write explicit mapping for SQL queries against maps.
 * @param keyFormat Key format
 * @param columns Columns as a dict where keys are column names, and values are case insensitive value formats.
 * @param client Client instance
 * @param mapName Map name
 * @param typeName Compact type name
 */
exports.createMappingForCompact = async (
    keyFormat, columns, client, mapName, typeName
) => {
    const columnsString = Object.entries(columns).map(column => `${column[0]} ${column[1].toUpperCase()}`).join(',\n');

    const createMappingQuery = `
            CREATE MAPPING ${mapName} (
                __key ${keyFormat.toUpperCase()}${Object.keys(columns).length > 0 ? ',' : ''}
                ${columnsString}
            )
            TYPE IMAP
            OPTIONS (
                'keyFormat' = '${keyFormat}',
                'valueFormat' = 'compact',
                'valueCompactTypeName' = '${typeName}'
            )
        `;

    await exports.getSql(client).execute(createMappingQuery);
};

exports.getRowMetadata = async (result) => {
    if (exports.isClientVersionAtLeast('5.0')) {
        return result.rowMetadata;
    } else {
        return await result.getRowMetadata();
    }
};

exports.getUpdateCount = async (result) => {
    if (exports.isClientVersionAtLeast('5.0')) {
        return result.updateCount;
    } else {
        return await result.getUpdateCount();
    }
};

exports.TestFactory = class TestFactory {
    constructor() {
        this.defaultConfig = `
            <hazelcast xmlns="http://www.hazelcast.com/schema/config"
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                xsi:schemaLocation="http://www.hazelcast.com/schema/config
                http://www.hazelcast.com/schema/config/hazelcast-config-4.0.xsd">
                <network>
                    <port>0</port>
                </network>
            </hazelcast>
        `;
        this.clusterIds = new Set();
        this.clients = new Set();
    }

    // Creates a new Hazelcast client for a serial test with given config and registers it to clients set
    async newHazelcastClientForSerialTests(clientConfig) {
        return await this._createClient(clientConfig);
    }

    // Creates a new Hazelcast client for a parallel test with given config and registers it to clients set
    async newHazelcastClientForParallelTests(clientConfig, memberOrMemberList) {
        // Add cluster member config for parallel tests.
        this._addClusterMembersToConfig(clientConfig, memberOrMemberList);
        return await this._createClient(clientConfig);
    }

    async _createClient(clientConfig) {
        const client = await Client.newHazelcastClient(clientConfig);
        this.clients.add(client);
        return client;
    }

    _addClusterMembersToConfig(clientConfig, memberOrMemberList) {
        if (memberOrMemberList === undefined) {
            return;
        }
        const clusterMembers = Array.isArray(memberOrMemberList) ? memberOrMemberList.map(m => `127.0.0.1:${m.port}`)
            : [`127.0.0.1:${memberOrMemberList.port}`];

        if (clientConfig.network === undefined) {
            clientConfig.network = {
                clusterMembers: clusterMembers
            };
        } else if (clientConfig.network.clusterMembers === undefined) {
            clientConfig.network.clusterMembers = clusterMembers;
        }
    }

    // Creates a new Hazelcast failover client for parallel tests with given config and registers it to clients set
    async newHazelcastFailoverClientForParallelTests(clientFailoverConfig, memberOrMemberList) {
        // Add cluster member config for parallel tests.
        clientFailoverConfig.clientConfigs.forEach(clientConfig => {
            this._addClusterMembersToConfig(clientConfig, memberOrMemberList);
        });

        return await this._createFailoverClient(clientFailoverConfig);
    }

    // Creates a new Hazelcast failover client for serial tests with given config and registers it to clients set
    async newHazelcastFailoverClientForSerialTests(clientFailoverConfig) {
        return await this._createFailoverClient(clientFailoverConfig);
    }

    async _createFailoverClient(clientFailoverConfig) {
        const client = await Client.newHazelcastFailoverClient(clientFailoverConfig);
        this.clients.add(client);
        return client;
    }

    async _createCluster(hzVersion, clusterConfig) {
        const cluster = await RC.createCluster(hzVersion, clusterConfig);
        this.clusterIds.add(cluster.id);
        return cluster;
    }

    // Creates a new Hazelcast cluster for a serial test and registers it to clusters set
    async createClusterForSerialTests(hzVersion = null, clusterConfig = null) {
        return await this._createCluster(hzVersion, clusterConfig);
    }

    // Creates a new Hazelcast cluster for a parallel test and registers it to clusters set
    async createClusterForParallelTests(hzVersion = null, clusterConfig = this.defaultConfig) {
        return await this._createCluster(hzVersion, clusterConfig);
    }

    // Creates a new Hazelcast for serial test cluster keeping its name and registers it to clusters set
    async createClusterKeepClusterNameForSerialTests(hzVersion = null, clusterConfig = null) {
        return await this._createClusterKeepClusterName(hzVersion, clusterConfig);
    }

    // Creates a new Hazelcast cluster for parallel test keeping its name and registers it to clusters set
    async createClusterKeepClusterNameForParallelTests(hzVersion = null, clusterConfig = this.defaultConfig) {
        return await this._createClusterKeepClusterName(hzVersion, clusterConfig);
    }

    // Creates a new Hazelcast cluster keeping its name and registers it to clusters set
    async _createClusterKeepClusterName(hzVersion, clusterConfig) {
        const cluster = await RC.createClusterKeepClusterName(hzVersion, clusterConfig);
        this.clusterIds.add(cluster.id);
        return cluster;
    }

    // Shutdowns all clients and clusters
    async shutdownAll() {
        for (const client of this.clients) {
            await client.shutdown();
        }

        for (const clusterId of this.clusterIds) {
            await RC.shutdownCluster(clusterId);
        }

        this.clients.clear();
        this.clusterIds.clear();
    }

    async shutdownAllClients() {
        for (const client of this.clients) {
            await client.shutdown();
        }

        this.clients.clear();
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

/**
 * This function will wait for the connections count to be equal to given parameter (connectionCount).
 */
exports.waitForConnectionCount = async (client, connectionCount) => {
    let getConnectionsFn;
    if (this.isClientVersionAtLeast('4.2')) {
        const clientRegistry = client.connectionRegistry;
        getConnectionsFn = clientRegistry.getConnections.bind(clientRegistry);
    } else {
        const connManager = client.getConnectionManager();
        getConnectionsFn = connManager.getActiveConnections.bind(connManager);
    }

    await this.assertTrueEventually(async () => {
        expect(getConnectionsFn().length).to.be.equal(connectionCount);
    });
};
/**
 * This function converts hours to seconds
 */
exports.GetTimeOffsetByHour = (hour) => {
    const timeOffset = hour * 60 * 60;
    return timeOffset;
};

