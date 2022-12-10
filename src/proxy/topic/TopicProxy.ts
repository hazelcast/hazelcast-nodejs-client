import {ITopic} from '../ITopic';
import {MessageListener} from '../MessageListener';
import {HazelcastError, Member, UUID} from '../../core';
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
import {EntryEvent} from '../EntryListener';
import {EventType} from '../EventType';

export class TopicProxy<E> extends PartitionSpecificProxy implements ITopic<E> {

    name: string;
    localOnly: boolean;
    listenerID: string;

    constructor(serviceName: string, name: string) {


    }

    publish(message: E): Promise<void> {
        assertNotNull(message);
        const toObject = this.serializationService.toObject.bind(this.serializationService);
        const messageData = this.toData(message);
        const request = TopicPublishCodec.encodeRequest(this.name, messageData);
        const partitionId = this.partitionService.getPartitionId(messageData);
        return this.encodeInvokeOnPartition(TopicPublishCodec, partitionId, ()=>{}, request);
    }

    publishAll(messages: any[]): Promise<void> {
        assertNotNull(messages);
        const toObject = this.serializationService.toObject.bind(this.serializationService);
        const messageDataList = this.toData(messages);
        const request = TopicPublishCodec.encodeRequest(this.name, messageDataList);
        const partitionId = this.partitionService.getPartitionId(messageDataList);
        return this.encodeInvokeOnPartition(TopicPublishCodec, partitionId, ()=>{}, request);
    }

    addListener(listener: MessageListener<E>): Promise<string> {
        assertNotNull(listener);

        // const entryEventHandler = (uuid: UUID,
        //                            numberOfAffectedEntries: number): void => {
        //     const member = this.clusterService.getMember(uuid.toString());
        //     const name = this.name;
        //
        //     const topicEvent = new TopicEvent(name, numberOfAffectedEntries, member);
        //
        //
        // }

        const handler = (m: ClientMessage): void => {
            TopicAddMessageListenerCodec.handle(m, this.toObject.bind(this));
        }

        return this.listenerService.registerListener(
            this.createListenerMessageCodec(),
            handler,
        );
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
                return TopicRemoveMessageListenerCodec.encodeRequest(this.name, super.listenerId);
            },
        };
    }
}


class TopicEvent {
    name: string;

    numberOfAffectedEntries: number;

    member: Member;

    constructor(name: string, numberOfAffectedEntries: number, member: Member) {
        this.name = name;
        this.numberOfAffectedEntries = numberOfAffectedEntries;
        this.member = member;
    }
}
