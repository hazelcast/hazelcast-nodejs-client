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
/** @ignore *//** */

import * as Long from 'long';
import {OverflowPolicy} from '../OverflowPolicy';
import {AddressImpl, TopicOverloadError} from '../../core';
import {SerializationService} from '../../serialization/SerializationService';
import {UuidUtil} from '../../util/UuidUtil';
import {
    deferredPromise,
    DeferredPromise
} from '../../util/Util';
import {BaseProxy} from '../BaseProxy';
import {Ringbuffer} from '../Ringbuffer';
import {ITopic} from '../ITopic';
import {ReliableTopicMessage} from './ReliableTopicMessage';
import {ReliableTopicListenerRunner} from './ReliableTopicListenerRunner';
import {MessageListener} from '../MessageListener';
import {TopicOverloadPolicy} from '../TopicOverloadPolicy';
import {ClientConfig, ClientConfigImpl} from '../../config/Config';
import {ClusterService} from '../../invocation/ClusterService';
import {ILogger} from '../../logging';
import {ProxyManager} from '../ProxyManager';
import {PartitionService} from '../../PartitionService';
import {InvocationService} from '../../invocation/InvocationService';
import {ConnectionRegistry} from '../../network/ClientConnectionManager';
import {ListenerService} from '../../listener/ListenerService';
import {ClientConnection} from '../../network/ClientConnection';

/** @internal */
export const TOPIC_INITIAL_BACKOFF = 100;
/** @internal */
export const TOPIC_MAX_BACKOFF = 2000;

/** @internal */
export class ReliableTopicProxy<E> extends BaseProxy implements ITopic<E> {
    private ringbuffer: Ringbuffer<ReliableTopicMessage>;
    private readonly batchSize: number;
    private readonly runners: { [key: string]: ReliableTopicListenerRunner<E> } = {};
    private readonly overloadPolicy: TopicOverloadPolicy;
    private readonly logger: ILogger;
    private readonly localAddress: AddressImpl;

    constructor(
        serviceName: string,
        name: string,
        logger: ILogger,
        clientConfig: ClientConfig,
        proxyManager: ProxyManager,
        partitionService: PartitionService,
        invocationService: InvocationService,
        serializationService: SerializationService,
        listenerService: ListenerService,
        clusterService: ClusterService,
        connectionRegistry: ConnectionRegistry
    ) {
        super(
            serviceName,
            name,
            proxyManager,
            partitionService,
            invocationService,
            serializationService,
            listenerService,
            clusterService,
            connectionRegistry
        );
        const connection: ClientConnection = this.connectionRegistry.getRandomConnection();
        this.localAddress = connection != null ? connection.getLocalAddress() : null;
        this.logger = logger;
        const config = (clientConfig as ClientConfigImpl).getReliableTopicConfig(name);
        this.batchSize = config.readBatchSize;
        this.overloadPolicy = config.overloadPolicy;
    }

    setRingbuffer(ringbuffer: Ringbuffer<ReliableTopicMessage>): void {
        this.ringbuffer = ringbuffer;
    }

    addMessageListener(listener: MessageListener<E>): string {
        const listenerId = UuidUtil.generate().toString();
        const runner = new ReliableTopicListenerRunner(listenerId, listener, this.ringbuffer,
            this.batchSize, this.serializationService, this.logger, this);

        this.runners[listenerId] = runner;

        this.ringbuffer.tailSequence().then((sequence: Long) => {
            runner.sequenceNumber = sequence.toNumber() + 1;
            runner.next();
        }).catch((e) => {
            this.logger.warn('ReliableTopicProxy', 'Failed to fetch sequence for runner.', e);
        });

        return listenerId;
    }

    removeMessageListener(listenerId: string): boolean {
        const runner = this.runners[listenerId];
        if (!runner) {
            return false;
        }

        runner.cancel();
        delete this.runners[listenerId];

        return true;
    }

    publish(message: E): Promise<void> {
        const reliableTopicMessage = new ReliableTopicMessage();
        reliableTopicMessage.payload = this.serializationService.toData(message);
        reliableTopicMessage.publishTime = Long.fromNumber(Date.now());
        reliableTopicMessage.publisherAddress = this.localAddress;

        switch (this.overloadPolicy) {
            case TopicOverloadPolicy.ERROR:
                return this.addWithError(reliableTopicMessage);
            case TopicOverloadPolicy.DISCARD_NEWEST:
                return this.addOrDiscard(reliableTopicMessage);
            case TopicOverloadPolicy.DISCARD_OLDEST:
                return this.addOrOverwrite(reliableTopicMessage);
            case TopicOverloadPolicy.BLOCK:
                return this.addWithBackoff(reliableTopicMessage);
            default:
                throw new RangeError('Unknown overload policy');
        }
    }

    public getRingbuffer(): Ringbuffer<ReliableTopicMessage> {
        return this.ringbuffer;
    }

    destroy(): Promise<void> {
        for (const k in this.runners) {
            const runner = this.runners[k];
            runner.cancel();
        }
        return this.ringbuffer.destroy();
    }

    private addOrDiscard(reliableTopicMessage: ReliableTopicMessage): Promise<void> {
        return this.ringbuffer.add(reliableTopicMessage, OverflowPolicy.FAIL).then<void>(() => {
            return null;
        });
    }

    private addWithError(reliableTopicMessage: ReliableTopicMessage): Promise<void> {
        return this.ringbuffer.add(reliableTopicMessage, OverflowPolicy.FAIL).then<void>((seq: Long) => {
            if (seq.toNumber() === -1) {
                throw new TopicOverloadError('Failed to publish message: ' + reliableTopicMessage +
                    ' on topic: ' + this.getName());
            }
            return null;
        });
    }

    private addOrOverwrite(reliableTopicMessage: ReliableTopicMessage): Promise<void> {
        return this.ringbuffer.add(reliableTopicMessage, OverflowPolicy.OVERWRITE).then<void>(() => {
            return null;
        });
    }

    private addWithBackoff(reliableTopicMessage: ReliableTopicMessage): Promise<void> {
        const deferred = deferredPromise<void>();
        this.trySendMessage(reliableTopicMessage, TOPIC_INITIAL_BACKOFF, deferred);
        return deferred.promise;
    }

    private trySendMessage(message: ReliableTopicMessage, delay: number, deferred: DeferredPromise<void>): void {
        this.ringbuffer.add(message, OverflowPolicy.FAIL).then((seq: Long) => {
            if (seq.toNumber() === -1) {
                let newDelay = delay *= 2;
                if (newDelay > TOPIC_MAX_BACKOFF) {
                    newDelay = TOPIC_MAX_BACKOFF;
                }
                this.trySendMessage(message, newDelay, deferred);
            } else {
                deferred.resolve();
            }
        }).catch(deferred.reject);
    }

}
