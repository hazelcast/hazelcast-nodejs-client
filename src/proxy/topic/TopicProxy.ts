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

import {ITopic} from '../ITopic';
import {Message, MessageListener} from '../MessageListener';
import {HazelcastError, UUID} from '../../core';
import {TopicAddMessageListenerCodec} from '../../codec/TopicAddMessageListenerCodec';
import { ListenerMessageCodec} from '../../listener/ListenerMessageCodec';
import {ClientMessage} from '../../protocol/ClientMessage';
import {assertNotNull} from '../../util/Util';
import {PartitionSpecificProxy} from '../PartitionSpecificProxy';
import {TopicPublishCodec} from '../../codec/TopicPublishCodec';
import Long = require('long');
import {Data} from '../../serialization';
import {ProxyManager} from '../ProxyManager';
import {PartitionService} from '../../PartitionService';
import {InvocationService} from '../../invocation/InvocationService';
import {SerializationService} from '../../serialization/SerializationService';
import {ListenerService} from '../../listener/ListenerService';
import {ClusterService} from '../../invocation/ClusterService';
import {ConnectionRegistry} from '../../network/ConnectionRegistry';
import {SchemaService} from '../../serialization/compact/SchemaService';
import {TopicPublishAllCodec} from '../../codec/TopicPublishAllCodec';
import {TopicRemoveMessageListenerCodec} from '../../codec/TopicRemoveMessageListenerCodec';

/** @internal */
export class TopicProxy<E> extends PartitionSpecificProxy implements ITopic<E> {

    constructor(
        serviceName: string,
        name: string,
        proxyManager: ProxyManager,
        partitionService: PartitionService,
        invocationService: InvocationService,
        serializationService: SerializationService,
        listenerService: ListenerService,
        clusterService: ClusterService,
        connectionRegistry: ConnectionRegistry,
        schemaService: SchemaService
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
            connectionRegistry,
            schemaService
        );
    }

    publish(message: E): Promise<void> {
        assertNotNull(message);

        const messageData = this.toData(message);
        return this.encodeInvoke(TopicPublishCodec, () => {}, messageData);
    }

    publishAll(messages: any[]): Promise<void> {
        assertNotNull(messages);
        for (const message of messages) {
            assertNotNull(message);
        }
        const messageDataList = this.toData(messages);
        return this.encodeInvoke(TopicPublishAllCodec, () => {}, messageDataList);
    }

    addListener(listener: MessageListener<E>): Promise<string> {
        assertNotNull(listener);

        const handler = (message: ClientMessage): void => {
            TopicAddMessageListenerCodec.handle(message, (item: Data, publishTime: Long, uuid: UUID) => {
                const msg = new Message<E>();
                msg.messageObject = this.toObject(item);
                msg.publishingTime = publishTime;
                msg.publisher = this.clusterService.getMember(uuid.toString()).address;

                listener(msg);
            });
        };

        const codec = this.createListenerCodec();
        return this.listenerService.registerListener(codec, handler);
    }

    private createListenerCodec(): ListenerMessageCodec {
        const name = this.name;
        return {
            encodeAddRequest(localOnly: boolean): ClientMessage {
                return TopicAddMessageListenerCodec.encodeRequest(name, localOnly);
            },
            decodeAddResponse(msg: ClientMessage): UUID {
                return TopicAddMessageListenerCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(): ClientMessage {
                return TopicRemoveMessageListenerCodec.encodeRequest(name, super.localOnly);
            },
        };
    }

    removeListener(listenerId: string): Promise<boolean> {
        return this.listenerService.deregisterListener(listenerId);
    }

    addMessageListener(listener: MessageListener<E>): string {
        throw new HazelcastError('This method is not supported for Topic. ' +
            'Use addListener instead.');
    }

    removeMessageListener(listenerId: string): boolean {
        throw new HazelcastError('This method is not supported for Topic. ' +
            'Use removeListener instead.');
    }
}
