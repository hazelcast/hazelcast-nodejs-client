import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {QueueMessageType} from './QueueMessageType';

var REQUEST_TYPE = QueueMessageType.QUEUE_REMAININGCAPACITY
var RESPONSE_TYPE = 102
var RETRYABLE = false


export class QueueRemainingCapacityCodec{

constructor() {
}




static calculateSize(name){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    return dataSize;
}

static encodeRequest(name){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;
    parameters['response'] = clientMessage.readInt();
    return parameters;

}


}
