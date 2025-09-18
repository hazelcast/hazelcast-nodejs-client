"use strict";
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
/** @ignore */ /** */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Statistics = void 0;
const ConnectionManager_1 = require("../network/ConnectionManager");
const ClientStatisticsCodec_1 = require("../codec/ClientStatisticsCodec");
const MetricsCompressor_1 = require("./MetricsCompressor");
const Util_1 = require("../util/Util");
const os = require("os");
const BuildInfo_1 = require("../BuildInfo");
const Long = require("long");
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
class Statistics {
    constructor(logger, metricsConfig, clientName, invocationService, nearCacheManager, connectionManager) {
        this.logger = logger;
        this.metricsConfig = metricsConfig;
        this.clientName = clientName;
        this.invocationService = invocationService;
        this.nearCacheManager = nearCacheManager;
        this.connectionManager = connectionManager;
        this.allGauges = {};
        this.compressorErrorLogged = false;
        this.enabled = this.metricsConfig.enabled;
        this.logger = logger;
        this.invocationService = invocationService;
        this.clientName = clientName;
        this.nearCacheManager = nearCacheManager;
    }
    /**
     * Registers all client statistics and schedules periodic collection of stats.
     */
    start() {
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
    stop() {
        if (this.statisticsSendTask != null) {
            (0, Util_1.cancelRepetitionTask)(this.statisticsSendTask);
        }
    }
    /**
     * @param periodSeconds the interval at which the statistics collection and send is being run
     */
    schedulePeriodicStatisticsSendTask(periodSeconds) {
        return (0, Util_1.scheduleWithRepetition)(() => {
            this.compressorErrorLogged = false;
            const collectionTimestamp = Long.fromNumber(Date.now());
            const connection = this.connectionManager.getConnectionRegistry().getRandomConnection();
            if (connection == null) {
                this.logger.trace('Statistics', 'Can not send client statistics to the server. No connection found.');
                return;
            }
            const stats = [];
            const compressor = new MetricsCompressor_1.MetricsCompressor();
            this.fillMetrics(stats, compressor, connection);
            this.addNearCacheStats(stats, compressor);
            this.sendStats(collectionTimestamp, stats.join(''), compressor, connection);
        }, 0, periodSeconds * 1000);
    }
    sendStats(collectionTimestamp, stats, compressor, connection) {
        compressor.generateBlob()
            .then((blob) => {
            const request = ClientStatisticsCodec_1.ClientStatisticsCodec.encodeRequest(collectionTimestamp, stats, blob);
            return this.invocationService.invokeOnConnection(connection, request, () => { });
        })
            .catch((err) => {
            this.logger.trace('Statistics', 'Could not send stats', err);
        });
    }
    registerMetrics() {
        this.registerGauge('os.freePhysicalMemorySize', () => os.freemem());
        this.registerGauge('os.processCpuTime', () => {
            // process.cpuUsage returns microseconds, so we convert to nanoseconds
            return process.cpuUsage().user * 1000;
        });
        this.registerGauge('os.systemLoadAverage', () => os.loadavg()[0], MetricsCompressor_1.ValueType.DOUBLE);
        this.registerGauge('os.totalPhysicalMemorySize', () => os.totalmem());
        this.registerGauge('runtime.availableProcessors', () => os.cpus().length);
        this.registerGauge('runtime.totalMemory', () => process.memoryUsage().heapTotal);
        this.registerGauge('runtime.uptime', () => process.uptime() * 1000);
        this.registerGauge('runtime.usedMemory', () => process.memoryUsage().heapUsed);
        this.registerGauge('tcp.bytesReceived', () => this.connectionManager.getTotalBytesRead(), undefined, MetricsCompressor_1.ProbeUnit.BYTES);
        this.registerGauge('tcp.bytesSend', () => this.connectionManager.getTotalBytesWritten(), undefined, MetricsCompressor_1.ProbeUnit.BYTES);
    }
    registerGauge(gaugeName, gaugeFn, type = MetricsCompressor_1.ValueType.LONG, unit) {
        try {
            // try a gauge function read, we will register it if it succeeds.
            gaugeFn();
            this.allGauges[gaugeName] = { gaugeFn, type, unit };
        }
        catch (err) {
            this.logger.warn('Statistics', 'Could not collect data for gauge '
                + gaugeName + ', it will not be registered', err);
            this.allGauges[gaugeName] = { gaugeFn: () => null, type, unit };
        }
    }
    static addAttribute(stats, name, value, keyPrefix) {
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
        }
        else {
            stats.push('' + value);
        }
    }
    addMetric(compressor, descriptor, value, type) {
        try {
            switch (type) {
                case MetricsCompressor_1.ValueType.LONG:
                    compressor.addLong(descriptor, value);
                    break;
                case MetricsCompressor_1.ValueType.DOUBLE:
                    compressor.addDouble(descriptor, value);
                    break;
                default:
                    this.logCompressorError(new Error('Unexpected type: ' + type));
            }
        }
        catch (err) {
            this.logCompressorError(err);
        }
    }
    addSimpleMetric(compressor, metric, value, type, unit) {
        const dotIdx = metric.lastIndexOf('.');
        let descriptor;
        if (dotIdx < 0) {
            // simple metric name
            descriptor = { metric };
        }
        else {
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
    fillMetrics(stats, compressor, connection) {
        Statistics.addAttribute(stats, 'lastStatisticsCollectionTime', Date.now());
        Statistics.addAttribute(stats, 'enterprise', 'false');
        Statistics.addAttribute(stats, 'clientType', ConnectionManager_1.CLIENT_TYPE);
        Statistics.addAttribute(stats, 'clientVersion', BuildInfo_1.BuildInfo.getClientVersion());
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
            }
            catch (err) {
                this.logger.trace('Statistics', 'Could not collect data for gauge ' + gaugeName, err);
            }
        }
    }
    static getNameWithPrefix(name) {
        const escapedName = [Statistics.NEAR_CACHE_CATEGORY_PREFIX];
        const prefixLen = Statistics.NEAR_CACHE_CATEGORY_PREFIX.length;
        escapedName.push(name);
        if (escapedName[prefixLen] === '/') {
            escapedName.splice(prefixLen, 1);
        }
        Statistics.escapeSpecialCharacters(escapedName, prefixLen);
        return escapedName;
    }
    static escapeSpecialCharacters(buffer, start) {
        for (let i = start; i < buffer.length; i++) {
            const c = buffer[i];
            if (c === '=' || c === '.' || c === ',' || c === Statistics.ESCAPE_CHAR) {
                buffer.splice(i, 0, Statistics.ESCAPE_CHAR);
                i++;
            }
        }
    }
    addNearCacheStats(stats, compressor) {
        for (const nearCache of this.nearCacheManager.listAllNearCaches()) {
            const name = nearCache.getName();
            const nearCacheNameWithPrefix = Statistics.getNameWithPrefix(name);
            nearCacheNameWithPrefix.push('.');
            const nameWithPrefix = nearCacheNameWithPrefix.join('');
            const nearCacheStats = nearCache.getStatistics();
            this.addNearCacheMetric(stats, compressor, 'creationTime', name, nameWithPrefix, nearCacheStats.creationTime, MetricsCompressor_1.ValueType.LONG, MetricsCompressor_1.ProbeUnit.MS);
            this.addNearCacheMetric(stats, compressor, 'evictions', name, nameWithPrefix, nearCacheStats.evictedCount, MetricsCompressor_1.ValueType.LONG, MetricsCompressor_1.ProbeUnit.COUNT);
            this.addNearCacheMetric(stats, compressor, 'hits', name, nameWithPrefix, nearCacheStats.hitCount, MetricsCompressor_1.ValueType.LONG, MetricsCompressor_1.ProbeUnit.COUNT);
            this.addNearCacheMetric(stats, compressor, 'misses', name, nameWithPrefix, nearCacheStats.missCount, MetricsCompressor_1.ValueType.LONG, MetricsCompressor_1.ProbeUnit.COUNT);
            this.addNearCacheMetric(stats, compressor, 'ownedEntryCount', name, nameWithPrefix, nearCacheStats.entryCount, MetricsCompressor_1.ValueType.LONG, MetricsCompressor_1.ProbeUnit.COUNT);
            this.addNearCacheMetric(stats, compressor, 'expirations', name, nameWithPrefix, nearCacheStats.expiredCount, MetricsCompressor_1.ValueType.LONG, MetricsCompressor_1.ProbeUnit.COUNT);
        }
    }
    addNearCacheMetric(stats, compressor, metric, nearCacheName, nearCacheNameWithPrefix, value, type, unit) {
        this.addMetric(compressor, Statistics.nearCacheDescriptor(metric, nearCacheName, unit), value, type);
        // necessary for compatibility with Management Center 4.0
        Statistics.addAttribute(stats, metric, value, nearCacheNameWithPrefix);
    }
    static nearCacheDescriptor(metric, nearCacheName, unit) {
        const descriptor = {
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
    logCompressorError(err) {
        if (!this.compressorErrorLogged) {
            this.logger.warn('Statistics', 'Could not add metric to compressed binary', err);
            this.compressorErrorLogged = true;
        }
        else {
            this.logger.trace('Statistics', 'Could not add metric to compressed binary', err);
        }
    }
}
exports.Statistics = Statistics;
Statistics.PERIOD_SECONDS_DEFAULT_VALUE = 3;
Statistics.PERIOD_SECONDS = 'hazelcast.client.statistics.period.seconds';
Statistics.NEAR_CACHE_CATEGORY_PREFIX = 'nc.';
Statistics.STAT_SEPARATOR = ',';
Statistics.KEY_VALUE_SEPARATOR = '=';
Statistics.ESCAPE_CHAR = '\\';
Statistics.EMPTY_STAT_VALUE = '';
//# sourceMappingURL=Statistics.js.map