import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {CacheMessageType} from './CacheMessageType';

var REQUEST_TYPE = CacheMessageType.CACHE_ENTRYPROCESSOR
var RESPONSE_TYPE = 105
var RETRYABLE = false


export class CacheEntryProcessorCodec{

constructor() {
}




static calculateSize(name, key, entryProcessor, arguments, completionId){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.calculateSizeData(key);
    dataSize += BitsUtil.calculateSizeData(entryProcessor);
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    for( argumentsItem in arguments){
    dataSize += BitsUtil.calculateSizeData(argumentsItem);
    }
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    return dataSize;
}

static encodeRequest(name, key, entryProcessor, arguments, completionId){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, key, entryProcessor, arguments, completionId));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendData(key);
    clientMessage.appendData(entryProcessor);
    clientMessage.appendInt(len(arguments))
    for( argumentsItem in arguments) {
    clientMessage.appendData(argumentsItem);
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
