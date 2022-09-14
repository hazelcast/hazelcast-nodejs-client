import {BaseProxy} from "../BaseProxy";
import {ITopic} from "../ITopic";
import {MessageListener} from "../MessageListener";
import {UUID} from "../../core";
import {TopicAddMessageListenerCodec} from "../../codec/TopicAddMessageListenerCodec";
import {TopicRemoveMessageListenerCodec} from "../../codec/TopicRemoveMessageListenerCodec";
import {TopicPublishCodec} from "../../codec/TopicPublishCodec";
import { ListenerMessageCodec} from "../../listener/ListenerMessageCodec";
import {ClientMessage} from "../../protocol/ClientMessage";
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

        const handler = TopicAddMessageListenerCodec.handle(message, () => {});
        return this.listenerService.registerListener(new Codec(),  handler);
    }

    removeMessageListener(listenerId: string): boolean {
        if (this.listenerService.deregisterListener(listenerId)){
            return true;
        }
        return false;
    }
}

//What is the 'name' we have here?
class Codec implements ListenerMessageCodec {

    encodeAddRequest(localOnly: boolean): ClientMessage {
        return TopicAddMessageListenerCodec.encodeRequest(this.name, localOnly);
    }

    decodeAddResponse(msg: ClientMessage): UUID {
        return TopicAddMessageListenerCodec.decodeResponse(msg);
    }

    //it returns UUID on Java but according to our codec it should return a string.
    encodeRemoveRequest(listenerId: string): UUID {
        return TopicRemoveMessageListenerCodec.encodeRequest(this.name, listenerId);
    }
}
