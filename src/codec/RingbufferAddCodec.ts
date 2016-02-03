import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {RingbufferMessageType} from './RingbufferMessageType';

var REQUEST_TYPE = RingbufferMessageType.RINGBUFFER_ADD
var RESPONSE_TYPE = 103
var RETRYABLE = false


export class RingbufferAddCodec{

constructor() {
}




static calculateSize(name, overflowPolicy, value){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    dataSize += BitsUtil.calculateSizeData(value);
    return dataSize;
}

static encodeRequest(name, overflowPolicy, value){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, overflowPolicy, value));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendInt(overflowPolicy);
    clientMessage.appendData(value);
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;
    parameters['response'] = clientMessage.readLong();
    return parameters;

}


}
