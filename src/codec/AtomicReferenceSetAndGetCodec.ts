import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {AtomicReferenceMessageType} from './AtomicReferenceMessageType';

var REQUEST_TYPE = AtomicReferenceMessageType.ATOMICREFERENCE_SETANDGET
var RESPONSE_TYPE = 105
var RETRYABLE = false


export class AtomicReferenceSetAndGetCodec{

constructor() {
}




static calculateSize(name, newValue){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    if(newValue !== null) {
    dataSize += BitsUtil.calculateSizeData(newValue);
    }
    return dataSize;
}

static encodeRequest(name, newValue){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, newValue));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendBool(newValue === null);
    if(newValue !== null){
    clientMessage.appendData(newValue);
    }
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;

if(clientMessage.readBool() === true){
    parameters['response'] = clientMessage.readData();
}
    return parameters;

}


}
