import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {CacheMessageType} from './CacheMessageType';

var REQUEST_TYPE = CacheMessageType.CACHE_PUTALL
var RESPONSE_TYPE = 100
var RETRYABLE = false


export class CachePutAllCodec{

constructor() {
}




static calculateSize(name, entries, expiryPolicy, completionId){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    for( entriesItem in entries){
    dataSize += BitsUtil.calculateSizeJava.util.map.entry<data, data >(entriesItem);
    }
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    if(expiryPolicy !== null) {
    dataSize += BitsUtil.calculateSizeData(expiryPolicy);
    }
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    return dataSize;
}

static encodeRequest(name, entries, expiryPolicy, completionId){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, entries, expiryPolicy, completionId));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendInt(len(entries))
    for( entriesItem in entries) {
    clientMessage.appendJava.util.map.entry<data, data >(entriesItem);
    }
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
    return parameters;

}


}
