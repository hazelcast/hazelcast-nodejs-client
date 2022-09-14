import {BaseProxy} from "../BaseProxy";
import {ITopic} from "../ITopic";
import {MessageListener} from "../MessageListener";
import {UUID} from "../../core";
import {TopicAddMessageListenerCodec} from "../../codec/TopicAddMessageListenerCodec";
import {TopicRemoveMessageListenerCodec} from "../../codec/TopicRemoveMessageListenerCodec";
import {TopicPublishCodec} from "../../codec/TopicPublishCodec";
import { ListenerMessageCodec} from "../../listener/ListenerMessageCodec";
import {ClientMessage, ClientMessageHandler} from "../../protocol/ClientMessage";
import {assertNotNull} from "../../util/Util";

export class TopicProxy<E> extends BaseProxy implements ITopic<E> {

    publish(message: E): Promise<void> {
        assertNotNull(message);
        const data = this.toData(message);
        const request = TopicPublishCodec.encodeRequest(this.name, data);
        const partitionId = request.getPartitionId();
        return this.encodeInvokeOnPartition<void>(TopicAddMessageListenerCodec,  partitionId, TopicAddMessageListenerCodec.decodeResponse);
    }

    addMessageListener(listener: MessageListener<E>): string {
        assertNotNull(listener);
        const message = TopicAddMessageListenerCodec.encodeRequest(this.name, false);
        const codec = this.createItemListener(this.name, false)
        TopicAddMessageListenerCodec.handle(message, () => {});
        //I am unable to fix this part. Will be trying tomorrow
        return this.listenerService.registerListener(codec,  (message => {
            TopicAddMessageListenerCodec.handle(message, ()=> {})
        }));
    }

    removeMessageListener(listenerId: string): boolean {
        if (this.listenerService.deregisterListener(listenerId)){
            return true;
        }
        return false;
    }

    private createItemListener(name: string, includeValue: boolean): ListenerMessageCodec {
        return {
            encodeAddRequest(localOnly: boolean): ClientMessage {
                return TopicAddMessageListenerCodec.encodeRequest(name, localOnly);
            },
            decodeAddResponse(msg: ClientMessage): UUID {
                return TopicAddMessageListenerCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId: UUID): ClientMessage {
                return TopicAddMessageListenerCodec.encodeRequest(name, false);
            },
        };
    }
}
