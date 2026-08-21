/*
 * Copyright (c) 2008-2026, Hazelcast, Inc. All Rights Reserved.
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

import {PartitionSpecificProxy} from '../PartitionSpecificProxy';
import {ITopic} from '../ITopic';
import {SchemaNotReplicatedError, UUID} from '../../core';
import {MessageListener, Message} from '../MessageListener';
import {TopicPublishCodec} from '../../codec/TopicPublishCodec';
import {Data} from '../../serialization';
import {ClientMessage} from '../../protocol/ClientMessage';
import {TopicAddMessageListenerCodec} from '../../codec/TopicAddMessageListenerCodec';
import {ListenerMessageCodec} from '../../listener/ListenerMessageCodec';
import {TopicRemoveMessageListenerCodec} from '../../codec/TopicRemoveMessageListenerCodec';

export class TopicProxy<E> extends PartitionSpecificProxy implements ITopic<E> {
    addMessageListener(listener: MessageListener<E>): Promise<string> {
        const handler = (message: ClientMessage): void => {
            TopicAddMessageListenerCodec.handle(message, (item, publishTime, uuid) => {
                let responseObject: E | null;
                if (item == null) {
                    responseObject = null;
                } else {
                    responseObject = this.toObject(item);
                }
                const member = this.clusterService.getMember(uuid.toString());
                if (member) {
                    const message = new Message<E>(responseObject, member.address, publishTime);
                    listener.apply(null, [message]);
                }
            });
        }
        const codec = this.createEntryListener(this.name);
        return this.listenerService.registerListener(codec, handler);
    }

    publish(message: E): Promise<void> {
        let messageData: Data;
        try {
            messageData = this.toData(message);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.publish(message));
            }
            throw e;
        }
        return this.encodeInvoke(TopicPublishCodec, () => {}, messageData);
    }

    removeMessageListener(listenerId: string): Promise<boolean> {
        return this.listenerService.deregisterListener(listenerId);
    }

    private createEntryListener(name: string): ListenerMessageCodec {
        return {
            encodeAddRequest(localOnly: boolean): ClientMessage {
                return TopicAddMessageListenerCodec.encodeRequest(name, localOnly);
            },
            decodeAddResponse(msg: ClientMessage): UUID {
                return TopicAddMessageListenerCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId: UUID): ClientMessage {
                return TopicRemoveMessageListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }
}
