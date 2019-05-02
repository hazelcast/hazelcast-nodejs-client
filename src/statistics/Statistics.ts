/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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

import HazelcastClient from '../HazelcastClient';
import {ClientConnection} from '../invocation/ClientConnection';
import {Properties} from '../config/Properties';
import {ClientStatisticsCodec} from '../codec/ClientStatisticsCodec';
import * as Util from '../Util';
import {Task} from '../Util';
import * as os from 'os';
import {BuildInfo} from '../BuildInfo';
import {ILogger} from '../logging/ILogger';
import Address = require('../Address');

/**
 * This class is the main entry point for collecting and sending the client
 * statistics to the cluster. If the client statistics feature is enabled,
 * it will be scheduled for periodic statistics collection and sent.
 */
export class Statistics {

    public static readonly PERIOD_SECONDS_DEFAULT_VALUE = 3;
    private static readonly ENABLED = 'hazelcast.client.statistics.enabled';
    private static readonly PERIOD_SECONDS = 'hazelcast.client.statistics.period.seconds';

    private static readonly NEAR_CACHE_CATEGORY_PREFIX: string = 'nc.';
    private static readonly FEATURE_SUPPORTED_SINCE_VERSION_STRING: string = '3.9';
    private static readonly FEATURE_SUPPORTED_SINCE_VERSION: number = BuildInfo.calculateServerVersionFromString(
        Statistics.FEATURE_SUPPORTED_SINCE_VERSION_STRING);
    private static readonly STAT_SEPARATOR: string = ',';
    private static readonly KEY_VALUE_SEPARATOR: string = '=';
    private static readonly ESCAPE_CHAR: string = '\\';
    private static readonly EMPTY_STAT_VALUE: string = '';
    private readonly allGauges: { [name: string]: () => any } = {};
    private readonly enabled: boolean;
    private readonly properties: Properties;
    private readonly logger: ILogger;
    private client: HazelcastClient;
    private ownerAddress: Address;
    private task: Task;

    constructor(clientInstance: HazelcastClient) {
        this.properties = clientInstance.getConfig().properties;
        this.enabled = this.properties[Statistics.ENABLED] as boolean;
        this.client = clientInstance;
        this.logger = this.client.getLoggingService().getLogger();
    }

    /**
     * Registers all client statistics and schedules periodic collection of stats.
     */
    start(): void {
        if (!this.enabled) {
            return;
        }

        this.registerMetrics();

        let periodSeconds = this.properties[Statistics.PERIOD_SECONDS] as number;
        if (periodSeconds <= 0) {
            const defaultValue = Statistics.PERIOD_SECONDS_DEFAULT_VALUE;
            this.logger.warn('Statistics', 'Provided client statistics ' + Statistics.PERIOD_SECONDS
                + ' can not be less than or equal to 0. You provided ' + periodSeconds
                + ' seconds as the configuration. Client will use the default value of ' + defaultValue + ' instead.');
            periodSeconds = defaultValue;
        }

        this.task = this.schedulePeriodicStatisticsSendTask(periodSeconds);

        this.logger.info('Statistics', 'Client statistics is enabled with period ' + periodSeconds + ' seconds.');
    }

    stop(): void {
        if (this.task != null) {
            Util.cancelRepetitionTask(this.task);
        }
    }

    /**
     * @param periodSeconds the interval at which the statistics collection and send is being run
     */
    schedulePeriodicStatisticsSendTask(periodSeconds: number): Task {
        return Util.scheduleWithRepetition(() => {
            const ownerConnection: ClientConnection = this.getOwnerConnection();
            if (ownerConnection == null) {
                this.logger.trace('Statistics', 'Can not send client statistics to the server. No owner connection.');
                return;
            }

            const stats: string[] = [];

            this.fillMetrics(stats, ownerConnection);

            this.addNearCacheStats(stats);

            this.sendStats(stats.join(''), ownerConnection);
        }, 0, periodSeconds * 1000);
    }

    sendStats(newStats: string, ownerConnection: ClientConnection): void {
        const request = ClientStatisticsCodec.encodeRequest(newStats);
        this.logger.trace('Statistics', 'Trying to send statistics to ' +
            this.client.getClusterService().ownerUuid + ' from ' + ownerConnection.getLocalAddress().toString());
        this.client.getInvocationService().invokeOnConnection(ownerConnection, request).catch((err) => {
            this.logger.trace('Statistics', 'Could not send stats ', err);
        });
    }

    /**
     * @return the owner connection to the server for the client only if the server supports the client statistics feature
     */
    private getOwnerConnection(): ClientConnection {
        const connection = this.client.getClusterService().getOwnerConnection();
        if (connection == null) {
            return null;
        }

        const ownerConnectionAddress: Address = connection.getAddress();
        const serverVersion: number = connection.getConnectedServerVersion();
        if (serverVersion < Statistics.FEATURE_SUPPORTED_SINCE_VERSION) {

            // do not print too many logs if connected to an old version server
            if (this.ownerAddress == null || !ownerConnectionAddress.equals(this.ownerAddress)) {
                this.logger.trace('Statistics', 'Client statistics can not be sent to server '
                    + ownerConnectionAddress + ' since, connected '
                    + 'owner server version is less than the minimum supported server version ' +
                    Statistics.FEATURE_SUPPORTED_SINCE_VERSION_STRING);

            }
            // cache the last connected server address for decreasing the log prints
            this.ownerAddress = ownerConnectionAddress;
            return null;
        }
        return connection;
    }

    private registerMetrics(): void {
        this.registerGauge('os.committedVirtualMemorySize', () => Statistics.EMPTY_STAT_VALUE);
        this.registerGauge('os.freePhysicalMemorySize', () => os.freemem());
        this.registerGauge('os.freeSwapSpaceSize', () => Statistics.EMPTY_STAT_VALUE);
        this.registerGauge('os.maxFileDescriptorCount', () => Statistics.EMPTY_STAT_VALUE);
        this.registerGauge('os.openFileDescriptorCount', () => Statistics.EMPTY_STAT_VALUE);
        this.registerGauge('os.processCpuTime', () => {
            // Nodejs 4 does not support this metric. So we do not print an ugly warning for that.
            if (Util.getNodejsMajorVersion() >= 6) {
                return process.cpuUsage().user * 1000; // process.cpuUsage returns micoseconds. We convert to nanoseconds.
            } else {
                return Statistics.EMPTY_STAT_VALUE;
            }
        });
        this.registerGauge('os.systemLoadAverage', () => os.loadavg()[0]);
        this.registerGauge('os.totalPhysicalMemorySize', () => os.totalmem());
        this.registerGauge('os.totalSwapSpaceSize', () => Statistics.EMPTY_STAT_VALUE);
        this.registerGauge('runtime.availableProcessors', () => os.cpus().length);
        this.registerGauge('runtime.freeMemory', () => Statistics.EMPTY_STAT_VALUE);
        this.registerGauge('runtime.maxMemory', () => Statistics.EMPTY_STAT_VALUE);
        this.registerGauge('runtime.totalMemory', () => process.memoryUsage().heapTotal);
        this.registerGauge('runtime.uptime', () => process.uptime() * 1000);
        this.registerGauge('runtime.usedMemory', () => process.memoryUsage().heapUsed);
        this.registerGauge('executionService.userExecutorQueueSize', () => Statistics.EMPTY_STAT_VALUE);
    }

    private registerGauge(gaugeName: string, gaugeFunc: () => any): void {
        try {
            // try a gauge function read, we will register it if it succeeds.
            gaugeFunc();
            this.allGauges[gaugeName] = gaugeFunc;
        } catch (e) {
            this.logger.warn('Statistics', 'Could not collect data for gauge ' + gaugeName + ' , it won\'t be registered', e);
            this.allGauges[gaugeName] = () => Statistics.EMPTY_STAT_VALUE;
        }
    }

    private addStat(stats: string[], name: string, value: any, keyPrefix?: string): void {
        if (stats.length !== 0) {
            stats.push(Statistics.STAT_SEPARATOR);
        }

        if (keyPrefix != null) {
            stats.push(keyPrefix);
        }

        stats.push(name);
        stats.push(Statistics.KEY_VALUE_SEPARATOR);
        stats.push(value);
    }

    private addEmptyStat(stats: string[], name: string, keyPrefix: string): void {
        this.addStat(stats, name, Statistics.EMPTY_STAT_VALUE, keyPrefix);
    }

    private fillMetrics(stats: string[], ownerConnection: ClientConnection): void {
        this.addStat(stats, 'lastStatisticsCollectionTime', new Date().getTime());
        this.addStat(stats, 'enterprise', 'false');
        this.addStat(stats, 'clientType', this.client.getClusterService().getClientInfo().type);
        this.addStat(stats, 'clientVersion', BuildInfo.getClientVersion());
        this.addStat(stats, 'clusterConnectionTimestamp', ownerConnection.getStartTime());
        this.addStat(stats, 'clientAddress', ownerConnection.getLocalAddress().toString());
        this.addStat(stats, 'clientName', this.client.getName());
        this.addStat(stats, 'credentials.principal', this.client.getConfig().groupConfig.name);

        for (const gaugeName in this.allGauges) {
            const gaugeValueFunc = this.allGauges[gaugeName];

            try {
                const value = gaugeValueFunc();
                this.addStat(stats, gaugeName, value);
            } catch (e) {
                this.logger.trace('Could not collect data for gauge ' + gaugeName, e);

            }
        }
    }

    private getNameWithPrefix(name: string): string[] {
        const escapedName = [Statistics.NEAR_CACHE_CATEGORY_PREFIX];
        const prefixLen = Statistics.NEAR_CACHE_CATEGORY_PREFIX.length;
        escapedName.push(name);
        if (escapedName[prefixLen] === '/') {
            escapedName.splice(prefixLen, 1);
        }

        this.escapeSpecialCharacters(escapedName, prefixLen);
        return escapedName;
    }

    private escapeSpecialCharacters(buffer: string[], start: number): void {
        for (let i = start; i < buffer.length; i++) {
            const c = buffer[i];
            if (c === '=' || c === '.' || c === ',' || c === Statistics.ESCAPE_CHAR) {
                buffer.splice(i, 0, Statistics.ESCAPE_CHAR);
                i++;
            }
        }
    }

    private addNearCacheStats(stats: string[]): void {
        for (const nearCache of this.client.getNearCacheManager().listAllNearCaches()) {
            const nearCacheNameWithPrefix = this.getNameWithPrefix(nearCache.getName());
            nearCacheNameWithPrefix.push('.');
            const nearCacheStats = nearCache.getStatistics();
            const prefix = nearCacheNameWithPrefix.join('');
            this.addStat(stats, 'creationTime', nearCacheStats.creationTime, prefix);
            this.addStat(stats, 'evictions', nearCacheStats.evictedCount, prefix);
            this.addStat(stats, 'hits', nearCacheStats.hitCount, prefix);
            this.addEmptyStat(stats, 'lastPersistenceDuration', prefix);
            this.addEmptyStat(stats, 'lastPersistenceKeyCount', prefix);
            this.addEmptyStat(stats, 'lastPersistenceTime', prefix);
            this.addEmptyStat(stats, 'lastPersistenceWrittenBytes', prefix);
            this.addStat(stats, 'misses', nearCacheStats.missCount, prefix);
            this.addStat(stats, 'ownedEntryCount', nearCacheStats.entryCount, prefix);
            this.addStat(stats, 'expirations', nearCacheStats.expiredCount, prefix);
            this.addEmptyStat(stats, 'ownedEntryMemoryCost', prefix);
            this.addEmptyStat(stats, 'lastPersistenceFailure', prefix);
        }
    }

}
