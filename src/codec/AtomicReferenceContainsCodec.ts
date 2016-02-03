import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {AtomicReferenceMessageType} from './AtomicReferenceMessageType';

var REQUEST_TYPE = AtomicReferenceMessageType.ATOMICREFERENCE_CONTAINS
var RESPONSE_TYPE = 101
var RETRYABLE = true


export class AtomicReferenceContainsCodec{

constructor() {
}




static calculateSize(name, expected){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    if(expected !== null) {
    dataSize += BitsUtil.calculateSizeData(expected);
    }
    return dataSize;
}

static encodeRequest(name, expected){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, expected));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendBool(expected === null);
    if(expected !== null){
    clientMessage.appendData(expected);
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
