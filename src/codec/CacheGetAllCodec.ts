import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {CacheMessageType} from './CacheMessageType';

var REQUEST_TYPE = CacheMessageType.CACHE_GETALL
var RESPONSE_TYPE = 117
var RETRYABLE = false


export class CacheGetAllCodec{

constructor() {
}




static calculateSize(name, keys, expiryPolicy){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    for( keysItem in keys){
    dataSize += BitsUtil.calculateSizeData(keysItem);
    }
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    if(expiryPolicy !== null) {
    dataSize += BitsUtil.calculateSizeData(expiryPolicy);
    }
    return dataSize;
}

static encodeRequest(name, keys, expiryPolicy){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, keys, expiryPolicy));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendInt(len(keys))
    for( keysItem in keys) {
    clientMessage.appendData(keysItem);
    }
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
    responseSize = clientMessage.readInt();
    response = [];
    for(var responseIndex = 0 ;  responseIndex <= responseSize ; responseIndex++){
    responseItem = clientMessage.readMapEntry();
        response.push(responseItem)
    }
    parameters['response'] = response
    return parameters;

}


}
