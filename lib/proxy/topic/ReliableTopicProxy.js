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
exports.ReliableTopicProxy = exports.TOPIC_MAX_BACKOFF = exports.TOPIC_INITIAL_BACKOFF = void 0;
const Long = require("long");
const OverflowPolicy_1 = require("../OverflowPolicy");
const core_1 = require("../../core");
const UuidUtil_1 = require("../../util/UuidUtil");
const Util_1 = require("../../util/Util");
const BaseProxy_1 = require("../BaseProxy");
const ReliableTopicMessage_1 = require("./ReliableTopicMessage");
const ReliableTopicListenerRunner_1 = require("./ReliableTopicListenerRunner");
const TopicOverloadPolicy_1 = require("../TopicOverloadPolicy");
/** @internal */
exports.TOPIC_INITIAL_BACKOFF = 100;
/** @internal */
exports.TOPIC_MAX_BACKOFF = 2000;
/** @internal */
class ReliableTopicProxy extends BaseProxy_1.BaseProxy {
    constructor(serviceName, name, logger, clientConfig, proxyManager, partitionService, invocationService, serializationService, listenerService, clusterService, connectionRegistry, schemaService) {
        super(serviceName, name, proxyManager, partitionService, invocationService, serializationService, listenerService, clusterService, connectionRegistry, schemaService);
        this.logger = logger;
        this.runners = {};
        const connection = this.connectionRegistry.getRandomConnection();
        this.localAddress = connection != null ? connection.getLocalAddress() : null;
        const config = clientConfig.getReliableTopicConfig(name);
        this.batchSize = config.readBatchSize;
        this.overloadPolicy = config.overloadPolicy;
    }
    setRingbuffer(ringbuffer) {
        this.ringbuffer = ringbuffer;
    }
    addMessageListener(listener) {
        const listenerId = UuidUtil_1.UuidUtil.generate().toString();
        const runner = new ReliableTopicListenerRunner_1.ReliableTopicListenerRunner(listenerId, listener, this.ringbuffer, this.batchSize, this.serializationService, this.logger, this);
        this.runners[listenerId] = runner;
        this.ringbuffer.tailSequence().then((sequence) => {
            runner.sequenceNumber = sequence.toNumber() + 1;
            runner.next();
        }).catch((e) => {
            this.logger.warn('ReliableTopicProxy', 'Failed to fetch sequence for runner.', e);
        });
        return listenerId;
    }
    removeMessageListener(listenerId) {
        const runner = this.runners[listenerId];
        if (!runner) {
            return false;
        }
        runner.cancel();
        delete this.runners[listenerId];
        return true;
    }
    publish(message) {
        const reliableTopicMessage = new ReliableTopicMessage_1.ReliableTopicMessage();
        try {
            reliableTopicMessage.payload = this.serializationService.toData(message);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.publish(message));
            }
            throw e;
        }
        reliableTopicMessage.publishTime = Long.fromNumber(Date.now());
        reliableTopicMessage.publisherAddress = this.localAddress;
        switch (this.overloadPolicy) {
            case TopicOverloadPolicy_1.TopicOverloadPolicy.ERROR:
                return this.addWithError(reliableTopicMessage);
            case TopicOverloadPolicy_1.TopicOverloadPolicy.DISCARD_NEWEST:
                return this.addOrDiscard(reliableTopicMessage);
            case TopicOverloadPolicy_1.TopicOverloadPolicy.DISCARD_OLDEST:
                return this.addOrOverwrite(reliableTopicMessage);
            case TopicOverloadPolicy_1.TopicOverloadPolicy.BLOCK:
                return this.addWithBackoff(reliableTopicMessage);
            default:
                throw new RangeError('Unknown overload policy');
        }
    }
    getRingbuffer() {
        return this.ringbuffer;
    }
    destroy() {
        for (const k in this.runners) {
            const runner = this.runners[k];
            runner.cancel();
        }
        return this.ringbuffer.destroy();
    }
    addOrDiscard(reliableTopicMessage) {
        return this.ringbuffer.add(reliableTopicMessage, OverflowPolicy_1.OverflowPolicy.FAIL).then(() => {
            return null;
        });
    }
    addWithError(reliableTopicMessage) {
        return this.ringbuffer.add(reliableTopicMessage, OverflowPolicy_1.OverflowPolicy.FAIL).then((seq) => {
            if (seq.toNumber() === -1) {
                throw new core_1.TopicOverloadError('Failed to publish message: ' + reliableTopicMessage +
                    ' on topic: ' + this.getName());
            }
            return null;
        });
    }
    addOrOverwrite(reliableTopicMessage) {
        return this.ringbuffer.add(reliableTopicMessage, OverflowPolicy_1.OverflowPolicy.OVERWRITE).then(() => {
            return null;
        });
    }
    addWithBackoff(reliableTopicMessage) {
        const deferred = (0, Util_1.deferredPromise)();
        this.trySendMessage(reliableTopicMessage, exports.TOPIC_INITIAL_BACKOFF, deferred);
        return deferred.promise;
    }
    trySendMessage(message, delay, deferred) {
        this.ringbuffer.add(message, OverflowPolicy_1.OverflowPolicy.FAIL).then((seq) => {
            if (seq.toNumber() === -1) {
                let newDelay = delay *= 2;
                if (newDelay > exports.TOPIC_MAX_BACKOFF) {
                    newDelay = exports.TOPIC_MAX_BACKOFF;
                }
                this.trySendMessage(message, newDelay, deferred);
            }
            else {
                deferred.resolve();
            }
        }).catch(deferred.reject);
    }
}
exports.ReliableTopicProxy = ReliableTopicProxy;
//# sourceMappingURL=ReliableTopicProxy.js.map