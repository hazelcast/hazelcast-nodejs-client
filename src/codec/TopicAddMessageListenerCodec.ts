import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {TopicMessageType} from './TopicMessageType';

var REQUEST_TYPE = TopicMessageType.TOPIC_ADDMESSAGELISTENER
var RESPONSE_TYPE = 104
var RETRYABLE = false


export class TopicAddMessageListenerCodec{

constructor() {
}




static calculateSize(name, localOnly){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    return dataSize;
}

static encodeRequest(name, localOnly){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, localOnly));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendBool(localOnly);
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;
    parameters['response'] = clientMessage.readStr();
    return parameters;

}


static handle(clientMessage, handleEventTOPIC ){
    // Event handler
    var messageType = clientMessage.getMessageType();
    if ( messageType === EVENT_TOPIC && handleEventTOPIC !== null) {
    item = clientMessage.readData();
    publishTime = clientMessage.readLong();
    uuid = clientMessage.readStr();
        handleEventTOPIC(item, publishTime, uuid)
    }
}
}
