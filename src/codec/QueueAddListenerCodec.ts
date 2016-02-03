import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {QueueMessageType} from './QueueMessageType';

var REQUEST_TYPE = QueueMessageType.QUEUE_ADDLISTENER
var RESPONSE_TYPE = 104
var RETRYABLE = false


export class QueueAddListenerCodec{

constructor() {
}




static calculateSize(name, includeValue, localOnly){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    return dataSize;
}

static encodeRequest(name, includeValue, localOnly){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, includeValue, localOnly));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendBool(includeValue);
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


static handle(clientMessage, handleEventITEM ){
    // Event handler
    var messageType = clientMessage.getMessageType();
    if ( messageType === EVENT_ITEM && handleEventITEM !== null) {

if(clientMessage.readBool() === true){
    item = clientMessage.readData();
}
    uuid = clientMessage.readStr();
    eventType = clientMessage.readInt();
        handleEventITEM(item, uuid, eventType)
    }
}
}
