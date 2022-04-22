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
/** @ignore *//** */

import {Connection} from '../network/Connection';
import {CLIENT_TYPE, ConnectionManager} from '../network/ConnectionManager';
import {ClientStatisticsCodec} from '../codec/ClientStatisticsCodec';
import {MetricDescriptor, MetricsCompressor, ProbeUnit, ValueType} from './MetricsCompressor';
import {cancelRepetitionTask, scheduleWithRepetition, Task} from '../util/Util';
import * as os from 'os';
import {BuildInfo} from '../BuildInfo';
import {ILogger} from '../logging/ILogger';
import * as Long from 'long';
import {InvocationService} from '../invocation/InvocationService';
import {NearCacheManager} from '../nearcache/NearCacheManager';
import {MetricsConfig} from '../config/MetricsConfig';

type GaugeDescription = {
    gaugeFn: () => number;
    type: ValueType;
    unit?: ProbeUnit;
}

/**
 * This class is the main entry point for collecting and sending the client
 * statistics to the cluster. If the client statistics feature is enabled,
 * it will be scheduled for periodic statistics collection and sent.
 *
 * Uses metricsConfig as configuration. The config from statistics properties
 * will be used if the metrics counterpart and statistics property is set. This logic
 * is in ConfigBuilder.
 * @internal
 */
export class Statistics {

    public static readonly PERIOD_SECONDS_DEFAULT_VALUE = 3;
    private static readonly PERIOD_SECONDS = 'hazelcast.client.statistics.period.seconds';

    private static readonly NEAR_CACHE_CATEGORY_PREFIX: string = 'nc.';
    private static readonly STAT_SEPARATOR: string = ',';
    private static readonly KEY_VALUE_SEPARATOR: string = '=';
    private static readonly ESCAPE_CHAR: string = '\\';
    private static readonly EMPTY_STAT_VALUE: string = '';
    private readonly allGauges: { [name: string]: GaugeDescription } = {};
    private readonly enabled: boolean;
    private statisticsSendTask: Task;
    private compressorErrorLogged = false;

    constructor(
        private readonly logger: ILogger,
        private readonly metricsConfig: MetricsConfig,
        private readonly clientName: string,
        private readonly invocationService: InvocationService,
        private readonly nearCacheManager: NearCacheManager,
        private readonly connectionManager: ConnectionManager
    ) {
        this.enabled = this.metricsConfig.enabled;
        this.logger = logger;
        this.invocationService = invocationService;
        this.clientName = clientName;
        this.nearCacheManager = nearCacheManager;
    }

    /**
     * Registers all client statistics and schedules periodic collection of stats.
     */
    start(): void {
        if (!this.enabled) {
            return;
        }

        this.registerMetrics();

        let periodSeconds = this.metricsConfig.collectionFrequencySeconds;
        if (periodSeconds <= 0) {
            const defaultValue = Statistics.PERIOD_SECONDS_DEFAULT_VALUE;
            this.logger.warn('Statistics', 'Provided client statistics ' + Statistics.PERIOD_SECONDS
                + ' can not be less than or equal to 0. You provided ' + periodSeconds
                + ' seconds as the configuration. Client will use the default value of ' + defaultValue + ' instead.');
            periodSeconds = defaultValue;
        }

        this.statisticsSendTask = this.schedulePeriodicStatisticsSendTask(periodSeconds);

        this.logger.info('Statistics', 'Client statistics is enabled with period ' + periodSeconds + ' seconds.');
    }

    stop(): void {
        if (this.statisticsSendTask != null) {
            cancelRepetitionTask(this.statisticsSendTask);
        }
    }

    /**
     * @param periodSeconds the interval at which the statistics collection and send is being run
     */
    schedulePeriodicStatisticsSendTask(periodSeconds: number): Task {
        return scheduleWithRepetition(() => {
            this.compressorErrorLogged = false;
            const collectionTimestamp = Long.fromNumber(Date.now());

            const connection = this.connectionManager.getConnectionRegistry().getRandomConnection();
            if (connection == null) {
                this.logger.trace('Statistics', 'Can not send client statistics to the server. No connection found.');
                return;
            }

            const stats: string[] = [];
            const compressor = new MetricsCompressor();

            this.fillMetrics(stats, compressor, connection);
            this.addNearCacheStats(stats, compressor);
            this.sendStats(collectionTimestamp, stats.join(''), compressor, connection);
        }, 0, periodSeconds * 1000);
    }

    sendStats(collectionTimestamp: Long,
              stats: string,
              compressor: MetricsCompressor,
              connection: Connection): void {
        compressor.generateBlob()
            .then((blob) => {
                const request = ClientStatisticsCodec.encodeRequest(collectionTimestamp, stats, blob);
                return this.invocationService.invokeOnConnection(connection, request, () => {});
            })
            .catch((err) => {
                this.logger.trace('Statistics', 'Could not send stats', err);
            });
    }

    private registerMetrics(): void {
        this.registerGauge('os.freePhysicalMemorySize', () => os.freemem());
        this.registerGauge('os.processCpuTime', () => {
            // process.cpuUsage returns microseconds, so we convert to nanoseconds
            return process.cpuUsage().user * 1000;
        });
        this.registerGauge('os.systemLoadAverage', () => os.loadavg()[0], ValueType.DOUBLE);
        this.registerGauge('os.totalPhysicalMemorySize', () => os.totalmem());
        this.registerGauge('runtime.availableProcessors', () => os.cpus().length);
        this.registerGauge('runtime.totalMemory', () => process.memoryUsage().heapTotal);
        this.registerGauge('runtime.uptime', () => process.uptime() * 1000);
        this.registerGauge('runtime.usedMemory', () => process.memoryUsage().heapUsed);
        this.registerGauge('tcp.bytesReceived', () => this.connectionManager.getTotalBytesRead(), undefined, ProbeUnit.BYTES);
        this.registerGauge('tcp.bytesSend', () => this.connectionManager.getTotalBytesWritten(), undefined, ProbeUnit.BYTES);
    }

    private registerGauge(
        gaugeName: string,
        gaugeFn: () => number,
        type: ValueType = ValueType.LONG,
        unit?: ProbeUnit
    ): void {
        try {
            // try a gauge function read, we will register it if it succeeds.
            gaugeFn();
            this.allGauges[gaugeName] = { gaugeFn, type, unit };
        } catch (err) {
            this.logger.warn('Statistics', 'Could not collect data for gauge '
                + gaugeName + ', it will not be registered', err);
            this.allGauges[gaugeName] = { gaugeFn: () => null, type, unit };
        }
    }

    private static addAttribute(stats: string[],
                         name: string,
                         value: number | string,
                         keyPrefix?: string): void {
        if (stats.length !== 0) {
            stats.push(Statistics.STAT_SEPARATOR);
        }

        if (keyPrefix != null) {
            stats.push(keyPrefix);
        }

        stats.push(name);
        stats.push(Statistics.KEY_VALUE_SEPARATOR);
        if (value === null) {
            stats.push(Statistics.EMPTY_STAT_VALUE);
        } else {
            stats.push('' + value);
        }
    }

    private addMetric(compressor: MetricsCompressor,
                      descriptor: MetricDescriptor,
                      value: number,
                      type: ValueType): void {
        try {
            switch (type) {
                case ValueType.LONG:
                    compressor.addLong(descriptor, value);
                    break;
                case ValueType.DOUBLE:
                    compressor.addDouble(descriptor, value);
                    break;
                default:
                    this.logCompressorError(new Error('Unexpected type: ' + type));
            }
        } catch (err) {
            this.logCompressorError(err);
        }
    }

    private addSimpleMetric(compressor: MetricsCompressor,
                            metric: string,
                            value: number,
                            type: ValueType,
                            unit?: ProbeUnit): void {
        const dotIdx = metric.lastIndexOf('.');
        let descriptor: MetricDescriptor;
        if (dotIdx < 0) {
            // simple metric name
            descriptor = { metric };
        } else {
            descriptor = {
                prefix: metric.substring(0, dotIdx),
                metric: metric.substring(dotIdx + 1)
            };
        }

        if (unit !== undefined) {
            descriptor.unit = unit;
        }

        this.addMetric(compressor, descriptor, value, type);
    }

    private fillMetrics(stats: string[],
                        compressor: MetricsCompressor,
                        connection: Connection): void {
        Statistics.addAttribute(stats, 'lastStatisticsCollectionTime', Date.now());
        Statistics.addAttribute(stats, 'enterprise', 'false');
        Statistics.addAttribute(stats, 'clientType', CLIENT_TYPE);
        Statistics.addAttribute(stats, 'clientVersion', BuildInfo.getClientVersion());
        Statistics.addAttribute(stats, 'clusterConnectionTimestamp', connection.getStartTime());
        Statistics.addAttribute(stats, 'clientAddress', connection.getLocalAddress().toString());
        Statistics.addAttribute(stats, 'clientName', this.clientName);

        for (const gaugeName in this.allGauges) {
            const gauge = this.allGauges[gaugeName];
            try {
                const value = gauge.gaugeFn();
                this.addSimpleMetric(compressor, gaugeName, value, gauge.type, gauge.unit);
                // necessary for compatibility with Management Center 4.0
                Statistics.addAttribute(stats, gaugeName, value);
            } catch (err) {
                this.logger.trace('Statistics', 'Could not collect data for gauge ' + gaugeName, err);
            }
        }
    }

    private static getNameWithPrefix(name: string): string[] {
        const escapedName = [Statistics.NEAR_CACHE_CATEGORY_PREFIX];
        const prefixLen = Statistics.NEAR_CACHE_CATEGORY_PREFIX.length;
        escapedName.push(name);
        if (escapedName[prefixLen] === '/') {
            escapedName.splice(prefixLen, 1);
        }

        Statistics.escapeSpecialCharacters(escapedName, prefixLen);
        return escapedName;
    }

    private static escapeSpecialCharacters(buffer: string[], start: number): void {
        for (let i = start; i < buffer.length; i++) {
            const c = buffer[i];
            if (c === '=' || c === '.' || c === ',' || c === Statistics.ESCAPE_CHAR) {
                buffer.splice(i, 0, Statistics.ESCAPE_CHAR);
                i++;
            }
        }
    }

    private addNearCacheStats(stats: string[], compressor: MetricsCompressor): void {
        for (const nearCache of this.nearCacheManager.listAllNearCaches()) {
            const name = nearCache.getName();
            const nearCacheNameWithPrefix = Statistics.getNameWithPrefix(name);
            nearCacheNameWithPrefix.push('.');
            const nameWithPrefix = nearCacheNameWithPrefix.join('');

            const nearCacheStats = nearCache.getStatistics();
            this.addNearCacheMetric(stats, compressor,
                'creationTime', name, nameWithPrefix, nearCacheStats.creationTime,
                ValueType.LONG, ProbeUnit.MS);
            this.addNearCacheMetric(stats, compressor,
                'evictions', name, nameWithPrefix, nearCacheStats.evictedCount,
                ValueType.LONG, ProbeUnit.COUNT);
            this.addNearCacheMetric(stats, compressor,
                'hits', name, nameWithPrefix, nearCacheStats.hitCount,
                ValueType.LONG, ProbeUnit.COUNT);
            this.addNearCacheMetric(stats, compressor,
                'misses', name, nameWithPrefix, nearCacheStats.missCount,
                ValueType.LONG, ProbeUnit.COUNT);
            this.addNearCacheMetric(stats, compressor,
                'ownedEntryCount', name, nameWithPrefix, nearCacheStats.entryCount,
                ValueType.LONG, ProbeUnit.COUNT);
            this.addNearCacheMetric(stats, compressor,
                'expirations', name, nameWithPrefix, nearCacheStats.expiredCount,
                ValueType.LONG, ProbeUnit.COUNT);
        }
    }

    private addNearCacheMetric(stats: string[],
                               compressor: MetricsCompressor,
                               metric: string,
                               nearCacheName: string,
                               nearCacheNameWithPrefix: string,
                               value: number,
                               type: ValueType,
                               unit: ProbeUnit): void {
        this.addMetric(compressor,
            Statistics.nearCacheDescriptor(metric, nearCacheName, unit),
            value, type);
        // necessary for compatibility with Management Center 4.0
        Statistics.addAttribute(stats, metric, value, nearCacheNameWithPrefix);
    }

    private static nearCacheDescriptor(metric: string,
                                nearCacheName: string,
                                unit?: ProbeUnit): MetricDescriptor {
        const descriptor: MetricDescriptor = {
            prefix: 'nearcache',
            metric,
            discriminator: 'name',
            discriminatorValue: nearCacheName
        };
        if (unit !== undefined) {
            descriptor.unit = unit;
        }
        return descriptor;
    }

    private logCompressorError(err: Error): void {
        if (!this.compressorErrorLogged) {
            this.logger.warn('Statistics', 'Could not add metric to compressed binary', err);
            this.compressorErrorLogged = true;
        } else {
            this.logger.trace('Statistics', 'Could not add metric to compressed binary', err);
        }
    }
}
