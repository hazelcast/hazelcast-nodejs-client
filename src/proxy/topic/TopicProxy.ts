import {ITopic} from '../ITopic';
import {MessageListener} from '../MessageListener';
import {UUID} from '../../core';
import {TopicAddMessageListenerCodec} from '../../codec/TopicAddMessageListenerCodec';
import {TopicRemoveMessageListenerCodec} from '../../codec/TopicRemoveMessageListenerCodec';
import { ListenerMessageCodec} from '../../listener/ListenerMessageCodec';
import {ClientMessage} from '../../protocol/ClientMessage';
import {assertNotNull} from '../../util/Util';
import {PartitionSpecificProxy} from '../PartitionSpecificProxy';

export class TopicProxy<E> extends PartitionSpecificProxy implements ITopic<E> {

    publish(message: E): Promise<void> {
        assertNotNull(message);
        return this.encodeInvoke<void>(TopicAddMessageListenerCodec,
                                       TopicAddMessageListenerCodec.decodeResponse);
    }

    addMessageListener(listener: MessageListener<E>): string {
        assertNotNull(listener);
        const message = TopicAddMessageListenerCodec.encodeRequest(this.name, false);
        const codec = this.createListenerMessageCodec()
        TopicAddMessageListenerCodec.handle(message, () => {});
        // The error message :
        // TS2345: Argument of type 'MessageListener<E>' is not assignable to parameter
        // of type 'ClientMessageHandler'.<br/>Types of parameters 'message' and 'message'
        // are incompatible.Type 'ClientMessage' is missing the following properties
        // from type 'Message<E>': messageObject, publisher, publishingTime
        // Other error message:
        // TS2322: Type 'Promise<string>' is not assignable to type 'string'.

        return this.listenerService.registerListener(codec, listener);
    }

     removeMessageListener(listenerId: string): boolean {
        // if (this.listenerService.deregisterListener(listenerId)){
        //     return true;
        // }
        // return false;
        // The error message :
        // TS2322: Type 'Promise<boolean>' is not assignable to type 'boolean'.
        return this.listenerService.deregisterListener(listenerId);
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
