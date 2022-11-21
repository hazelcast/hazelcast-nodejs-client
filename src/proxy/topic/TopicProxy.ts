import {ITopic} from '../ITopic';
import {MessageListener} from '../MessageListener';
import {HazelcastError, UUID} from '../../core';
import {TopicAddMessageListenerCodec} from '../../codec/TopicAddMessageListenerCodec';
import {TopicRemoveMessageListenerCodec} from '../../codec/TopicRemoveMessageListenerCodec';
import { ListenerMessageCodec} from '../../listener/ListenerMessageCodec';
import {ClientMessage} from '../../protocol/ClientMessage';
import {assertNotNull} from '../../util/Util';
import {PartitionSpecificProxy} from '../PartitionSpecificProxy';
import {TopicPublishCodec} from '../../codec/TopicPublishCodec';
import {HazelcastClient} from '../../HazelcastClient';
import Long = require('long');
import {Data} from '../../serialization';

export class TopicProxy<E> extends PartitionSpecificProxy implements ITopic<E> {

    publish(message: E): Promise<void> {
        assertNotNull(message);
        const toObject = this.serializationService.toObject.bind(this.serializationService);
        const messageData = toObject(message);
        const request = TopicPublishCodec.encodeRequest(this.name, messageData);
        const partitionId = this.partitionService.getPartitionId(messageData);
        return this.encodeInvokeOnPartition(TopicPublishCodec, partitionId, ()=>{}, request);
    }

    publishAll(messages: any[]): Promise<void> {
        assertNotNull(messages);
        const toObject = this.serializationService.toObject.bind(this.serializationService);
        const messageDataList = toObject(messages);
        const request = TopicPublishCodec.encodeRequest(this.name, messageDataList);
        const partitionId = this.partitionService.getPartitionId(messageDataList);
        return this.encodeInvokeOnPartition(TopicPublishCodec, partitionId, ()=>{}, request);
    }

    addListener(listener: MessageListener<E>): Promise<string> {
        assertNotNull(listener);
        const client = new HazelcastClient();

        return this.listenerService.registerListener(this.createListenerMessageCodec(), (message: ClientMessage) => {
            TopicAddMessageListenerCodec.handle(message, (item: Data, publishTime: Long, uuid: UUID) => {
                const member = client.getClusterService().getMember(uuid.toString());
            // I cannot figure out how to implement DataAwareMessage(from Java) here
            // Should I implement or do we have another way to do this?
            }

            );
        });
    }

     removeListener(listenerId: string): Promise<boolean> {
        return this.listenerService.deregisterListener(listenerId);
    }

    addMessageListener(listener: MessageListener<E>): string {
        throw new HazelcastError('This method is not supported for Topic. ' +
                                        'Try to use addListener instead.');
    }

    removeMessageListener(listenerId: string): boolean {
        throw new HazelcastError('This method is not supported for Topic. ' +
                                        'Try to use removeListener instead.');
    }

    private createListenerMessageCodec(): ListenerMessageCodec {
        return {
            encodeAddRequest(): ClientMessage {
                return TopicAddMessageListenerCodec.encodeRequest(this.name, this.localOnly);
            },
            decodeAddResponse(msg: ClientMessage): UUID {
                return TopicAddMessageListenerCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(): ClientMessage {
                return TopicRemoveMessageListenerCodec.encodeRequest(this.name, this.listenerId);
            },
        };
    }
}
