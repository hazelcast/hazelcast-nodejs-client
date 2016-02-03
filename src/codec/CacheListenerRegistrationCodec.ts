import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {CacheMessageType} from './CacheMessageType';

var REQUEST_TYPE = CacheMessageType.CACHE_LISTENERREGISTRATION
var RESPONSE_TYPE = 100
var RETRYABLE = false


export class CacheListenerRegistrationCodec{

constructor() {
}




static calculateSize(name, listenerConfig, shouldRegister, address){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.calculateSizeData(listenerConfig);
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    dataSize += BitsUtil.calculateSizeCom.hazelcast.nio.address(address);
    return dataSize;
}

static encodeRequest(name, listenerConfig, shouldRegister, address){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, listenerConfig, shouldRegister, address));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendData(listenerConfig);
    clientMessage.appendBool(shouldRegister);
    AddressCodec.encode(clientMessage, address);
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;
    return parameters;

}


}
