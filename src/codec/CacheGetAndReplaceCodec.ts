import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {CacheMessageType} from './CacheMessageType';

var REQUEST_TYPE = CacheMessageType.CACHE_GETANDREPLACE
var RESPONSE_TYPE = 105
var RETRYABLE = false


export class CacheGetAndReplaceCodec{

constructor() {
}




static calculateSize(name, key, value, expiryPolicy, completionId){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.calculateSizeData(key);
    dataSize += BitsUtil.calculateSizeData(value);
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    if(expiryPolicy !== null) {
    dataSize += BitsUtil.calculateSizeData(expiryPolicy);
    }
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    return dataSize;
}

static encodeRequest(name, key, value, expiryPolicy, completionId){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, key, value, expiryPolicy, completionId));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendData(key);
    clientMessage.appendData(value);
    clientMessage.appendBool(expiryPolicy === null);
    if(expiryPolicy !== null){
    clientMessage.appendData(expiryPolicy);
    }
    clientMessage.appendInt(completionId);
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
