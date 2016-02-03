import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {AtomicReferenceMessageType} from './AtomicReferenceMessageType';

var REQUEST_TYPE = AtomicReferenceMessageType.ATOMICREFERENCE_COMPAREANDSET
var RESPONSE_TYPE = 101
var RETRYABLE = false


export class AtomicReferenceCompareAndSetCodec{

constructor() {
}




static calculateSize(name, expected, updated){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    if(expected !== null) {
    dataSize += BitsUtil.calculateSizeData(expected);
    }
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    if(updated !== null) {
    dataSize += BitsUtil.calculateSizeData(updated);
    }
    return dataSize;
}

static encodeRequest(name, expected, updated){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, expected, updated));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendBool(expected === null);
    if(expected !== null){
    clientMessage.appendData(expected);
    }
    clientMessage.appendBool(updated === null);
    if(updated !== null){
    clientMessage.appendData(updated);
    }
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;
    parameters['response'] = clientMessage.readBool();
    return parameters;

}


}
