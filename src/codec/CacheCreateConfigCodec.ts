import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {CacheMessageType} from './CacheMessageType';

var REQUEST_TYPE = CacheMessageType.CACHE_CREATECONFIG
var RESPONSE_TYPE = 105
var RETRYABLE = true


export class CacheCreateConfigCodec{

constructor() {
}




static calculateSize(cacheConfig, createAlsoOnOthers){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeData(cacheConfig);
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    return dataSize;
}

static encodeRequest(cacheConfig, createAlsoOnOthers){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(cacheConfig, createAlsoOnOthers));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendData(cacheConfig);
    clientMessage.appendBool(createAlsoOnOthers);
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
