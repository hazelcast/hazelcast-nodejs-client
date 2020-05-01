/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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

import {ReadResultSet} from '../../';
import {StaleSequenceError} from '../../HazelcastError';
import {SerializationService} from '../../serialization/SerializationService';
import {Ringbuffer} from '../Ringbuffer';
import {ReliableTopicMessage} from './ReliableTopicMessage';
import {ReliableTopicProxy} from './ReliableTopicProxy';
import {Message} from './Message';
import {MessageListener} from './MessageListener';
import {ILogger} from '../../logging/ILogger';

export class ReliableTopicListenerRunner<E> {

    public sequenceNumber: number = 0;
    private listener: MessageListener<E>;
    private ringbuffer: Ringbuffer<ReliableTopicMessage>;
    private batchSize: number;
    private serializationService: SerializationService;
    private cancelled: boolean = false;
    private logger: ILogger;
    private proxy: ReliableTopicProxy<E>;
    private listenerId: string;

    constructor(listenerId: string, listener: MessageListener<E>, ringbuffer: Ringbuffer<ReliableTopicMessage>,
                batchSize: number, serializationService: SerializationService, logger: ILogger, proxy: ReliableTopicProxy<E>) {
        this.listenerId = listenerId;
        this.listener = listener;
        this.ringbuffer = ringbuffer;
        this.batchSize = batchSize;
        this.serializationService = serializationService;
        this.proxy = proxy;
        this.logger = logger;
    }

    public next(): void {

        if (this.cancelled) {
            return;
        }

        this.ringbuffer.readMany(this.sequenceNumber, 1, this.batchSize).then((result: ReadResultSet<ReliableTopicMessage>) => {
            if (!this.cancelled) {
                for (let i = 0; i < result.size(); i++) {
                    const msg = new Message<E>();
                    const item = result.get(i);
                    msg.messageObject = this.serializationService.toObject(item.payload);
                    msg.publisher = item.publisherAddress;
                    msg.publishingTime = item.publishTime;
                    setImmediate(this.listener, msg);
                    this.sequenceNumber++;
                }
                setImmediate(this.next.bind(this));
            }
        }).catch((e) => {
            let message: string;
            // TODO Server does not throw StaleSequenceError anymore. https://github.com/hazelcast/hazelcast/pull/16303
            if (e instanceof StaleSequenceError) {
                this.ringbuffer.headSequence().then((seq: Long) => {
                    const newSequence = seq.toNumber();

                    message = 'Topic "' + this.proxy.getName() + '" ran into a stale sequence. ' +
                        ' Jumping from old sequence ' + this.sequenceNumber + ' to new sequence ' + newSequence;
                    this.logger.warn('ReliableTopicListenerRunner', message);

                    this.sequenceNumber = newSequence;
                    setImmediate(this.next.bind(this));
                });

                return;
            }

            message = 'Listener of topic "' + this.proxy.getName() + '" caught an exception, terminating listener. ' + e;
            this.logger.warn('ReliableTopicListenerRunner', message);

            this.proxy.removeMessageListener(this.listenerId);
        });
    }

    public cancel(): void {
        this.cancelled = true;
    }

}
