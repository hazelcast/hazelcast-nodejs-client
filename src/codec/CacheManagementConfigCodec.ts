import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {CacheMessageType} from './CacheMessageType';

var REQUEST_TYPE = CacheMessageType.CACHE_MANAGEMENTCONFIG
var RESPONSE_TYPE = 100
var RETRYABLE = true


export class CacheManagementConfigCodec{

constructor() {
}




static calculateSize(name, isStat, enabled, address){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    dataSize += BitsUtil.calculateSizeCom.hazelcast.nio.address(address);
    return dataSize;
}

static encodeRequest(name, isStat, enabled, address){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, isStat, enabled, address));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendBool(isStat);
    clientMessage.appendBool(enabled);
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
