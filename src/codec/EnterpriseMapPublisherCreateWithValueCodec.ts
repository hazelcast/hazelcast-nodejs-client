import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {EnterpriseMapMessageType} from './EnterpriseMapMessageType';

var REQUEST_TYPE = EnterpriseMapMessageType.ENTERPRISEMAP_PUBLISHERCREATEWITHVALUE
var RESPONSE_TYPE = 117
var RETRYABLE = true


export class EnterpriseMapPublisherCreateWithValueCodec{

constructor() {
}




static calculateSize(mapName, cacheName, predicate, batchSize, bufferSize, delaySeconds, populate, coalesce){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(mapName);
    dataSize += BitsUtil.calculateSizeStr(cacheName);
    dataSize += BitsUtil.calculateSizeData(predicate);
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    return dataSize;
}

static encodeRequest(mapName, cacheName, predicate, batchSize, bufferSize, delaySeconds, populate, coalesce){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(mapName, cacheName, predicate, batchSize, bufferSize, delaySeconds, populate, coalesce));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(mapName);
    clientMessage.appendStr(cacheName);
    clientMessage.appendData(predicate);
    clientMessage.appendInt(batchSize);
    clientMessage.appendInt(bufferSize);
    clientMessage.appendLong(delaySeconds);
    clientMessage.appendBool(populate);
    clientMessage.appendBool(coalesce);
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
