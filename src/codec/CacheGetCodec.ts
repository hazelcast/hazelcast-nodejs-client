import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {CacheMessageType} from './CacheMessageType';

var REQUEST_TYPE = CacheMessageType.CACHE_GET
var RESPONSE_TYPE = 105
var RETRYABLE = true


export class CacheGetCodec{

constructor() {
}




static calculateSize(name, key, expiryPolicy){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.calculateSizeData(key);
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    if(expiryPolicy !== null) {
    dataSize += BitsUtil.calculateSizeData(expiryPolicy);
    }
    return dataSize;
}

static encodeRequest(name, key, expiryPolicy){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, key, expiryPolicy));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendData(key);
    clientMessage.appendBool(expiryPolicy === null);
    if(expiryPolicy !== null){
    clientMessage.appendData(expiryPolicy);
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
