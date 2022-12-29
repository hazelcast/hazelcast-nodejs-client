import {ITopic} from '../ITopic';
import {Message, MessageListener} from '../MessageListener';
import {AddressImpl, HazelcastError, UUID} from '../../core';
import {TopicAddMessageListenerCodec} from '../../codec/TopicAddMessageListenerCodec';
import {TopicRemoveMessageListenerCodec} from '../../codec/TopicRemoveMessageListenerCodec';
import { ListenerMessageCodec} from '../../listener/ListenerMessageCodec';
import {ClientMessage} from '../../protocol/ClientMessage';
import {assertNotNull} from '../../util/Util';
import {PartitionSpecificProxy} from '../PartitionSpecificProxy';
import {TopicPublishCodec} from '../../codec/TopicPublishCodec';
import Long = require('long');
import {Data} from '../../serialization';
import {ClientConfig, ClientConfigImpl} from '../../config';
import {ProxyManager} from '../ProxyManager';
import {PartitionService} from '../../PartitionService';
import {InvocationService} from '../../invocation/InvocationService';
import {SerializationService} from '../../serialization/SerializationService';
import {ListenerService} from '../../listener/ListenerService';
import {ClusterService} from '../../invocation/ClusterService';
import {ConnectionRegistry} from '../../network/ConnectionRegistry';
import {SchemaService} from '../../serialization/compact/SchemaService';
import {Connection} from '../../network/Connection';
import {TopicOverloadPolicy} from '../TopicOverloadPolicy';

export class TopicProxy<E> extends PartitionSpecificProxy implements ITopic<E> {


    private readonly overloadPolicy: TopicOverloadPolicy;
    private readonly localAddress: AddressImpl;


    constructor(
        serviceName: string,
        name: string,
        clientConfig: ClientConfig,
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
        const connection: Connection = this.connectionRegistry.getRandomConnection();
        this.localAddress = connection != null ? connection.getLocalAddress() : null;
        const config = (clientConfig as ClientConfigImpl).getReliableTopicConfig(name);
        this.overloadPolicy = config.overloadPolicy;
    }

    publish(message: E): Promise<void> {
        assertNotNull(message);

        const messageData = this.toData(message);
        const request = TopicPublishCodec.encodeRequest(this.name, messageData);
        const partitionId = this.partitionService.getPartitionId(messageData);
        return this.encodeInvokeOnPartition(TopicPublishCodec, partitionId, () => {
        }, request);
    }

    publishAll(messages: any[]): Promise<void> {
        assertNotNull(messages);
        const messageDataList = this.toData(messages);
        const request = TopicPublishCodec.encodeRequest(this.name, messageDataList);
        const partitionId = this.partitionService.getPartitionId(messageDataList);
        return this.encodeInvokeOnPartition(TopicPublishCodec, partitionId, () => {
        }, request);
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

        const codec = this.createListenerCodec(this.name);
        return this.listenerService.registerListener(codec, handler);
    }

    private createListenerCodec(name: string): ListenerMessageCodec {
        return {
            encodeAddRequest(localOnly: boolean): ClientMessage {
                return TopicAddMessageListenerCodec.encodeRequest(name, localOnly);
            },
            decodeAddResponse(msg: ClientMessage): UUID {
                return TopicAddMessageListenerCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(): ClientMessage {
                return TopicAddMessageListenerCodec.encodeRequest(name, super.localOnly);
            },
        };
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
}

//     private createListenerMessageCodec(): ListenerMessageCodec {
//         return {
//             encodeAddRequest(): ClientMessage {
//                 return TopicAddMessageListenerCodec.encodeRequest(super.name, super.localOnly);
//             },
//             decodeAddResponse(msg: ClientMessage): UUID {
//                 return TopicAddMessageListenerCodec.decodeResponse(msg);
//             },
//             encodeRemoveRequest(): ClientMessage {
//                 return TopicRemoveMessageListenerCodec.encodeRequest(super.name, super.listenerId);
//             },
//         };
//     }
// }

//
// class TopicEvent {
//     name: string;
//
//     numberOfAffectedEntries: number;
//
//     member: Member;
//
//     constructor(name: string, numberOfAffectedEntries: number, member: Member) {
//         this.name = name;
//         this.numberOfAffectedEntries = numberOfAffectedEntries;
//         this.member = member;
//     }
// }
//
// class DataAwareMessage extends Message<Object> {
//
//     messageData: Data;
//     serializationService: SerializationService;
//
//     serialVersionUID = 1;
//
//     constructor(messageData: Data, publishTime: Long, publishingMember: Member, serializationService: SerializationService) {
//         super();
//         this.serializationService = serializationService;
//         this.messageData = messageData;
//     }
//
//     getMessageObject(): Object {
//         if (this.messageObject == null && this.messageData != null) {
//             this.messageObject = this.serializationService.toObject(this.messageData);
//         }
//         return this.messageObject;
//     }
//
//     getMessageData(): Data {
//         return this.messageData;
//     }
// }
//
// class TopicMessage<E> {
//
//     name: string;
//     message: E;
//     publishTime: Long;
//     publishingMember: Member;
//
//     constructor(name: string, message: E, publishTime: Long, publishingMember: Member) {
//         this.name = name;
//         this.message = message;
//         this.publishTime = publishTime;
//         this.publishingMember = publishingMember;
//     }
// }
