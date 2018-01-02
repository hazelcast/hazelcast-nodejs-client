/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
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

import {TopicMessageListener} from './TopicMessageListener';
import {IRingbuffer} from '../IRingbuffer';
import {RawTopicMessage} from './RawTopicMessage';
import {SerializationService} from '../../serialization/SerializationService';
import {ReliableTopicProxy} from './ReliableTopicProxy';
import {LoggingService} from '../../logging/LoggingService';
import {TopicMessage} from './TopicMessage';

export class ReliableTopicListenerRunner<E> {

    private listener: TopicMessageListener<E>;
    private ringbuffer: IRingbuffer<RawTopicMessage>;
    private batchSize: number;
    public sequenceNumber: number = 0;
    private serializationService: SerializationService;
    private cancelled: boolean = false;
    private loggingService = LoggingService.getLoggingService();
    private proxy: ReliableTopicProxy<E>;
    private listenerId: string;


    constructor(listenerId: string, listener: TopicMessageListener<E>, ringbuffer: IRingbuffer<RawTopicMessage>,
                batchSize: number, serializationService: SerializationService, proxy: ReliableTopicProxy<E>) {
        this.listenerId = listenerId;
        this.listener = listener;
        this.ringbuffer = ringbuffer;
        this.batchSize = batchSize;
        this.serializationService = serializationService;
        this.proxy = proxy;
    }

    public next(): void {

        if (this.cancelled) {
            return;
        }

        this.ringbuffer.readMany(this.sequenceNumber, 1, this.batchSize).then((result: Array<RawTopicMessage>) => {
            if (!this.cancelled) {
                result.forEach((raw: RawTopicMessage) => {
                    let msg = new TopicMessage<E>();
                    msg.messageObject = this.serializationService.toObject(raw.payload);
                    msg.publisher = raw.publisherAddress;
                    msg.publishingTime = raw.publishTime;
                    setImmediate(this.listener, msg);
                    this.sequenceNumber++;
                });

                setImmediate(this.next.bind(this));
            }
        }).catch((e) => {
            if (e.className === 'com.hazelcast.ringbuffer.StaleSequenceException') {
                this.ringbuffer.headSequence().then((seq: Long) => {
                    var newSequence = seq.toNumber();

                    var message = 'Topic "' + this.proxy.getName() + '" ran into a stale sequence. ' +
                    ' Jumping from old sequence ' + this.sequenceNumber + ' to new sequence ' + newSequence;
                    this.loggingService.warn('ReliableTopicListenerRunner', message);

                    this.sequenceNumber = newSequence;
                    setImmediate(this.next.bind(this));
                });

                return;
            }

            var message = 'Listener of topic "' + this.proxy.getName() + '" caught an exception, terminating listener. ' + e;
            this.loggingService.warn('ReliableTopicListenerRunner', message);

            this.proxy.removeMessageListener(this.listenerId);
        });
    }

    public cancel(): void {
        this.cancelled = true;
    }

}
