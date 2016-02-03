import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {MapMessageType} from './MapMessageType';

var REQUEST_TYPE = MapMessageType.MAP_EXECUTEONKEYS
var RESPONSE_TYPE = 117
var RETRYABLE = false


export class MapExecuteOnKeysCodec{

constructor() {
}




static calculateSize(name, entryProcessor, keys){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.calculateSizeData(entryProcessor);
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    for( keysItem in keys){
    dataSize += BitsUtil.calculateSizeData(keysItem);
    }
    return dataSize;
}

static encodeRequest(name, entryProcessor, keys){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, entryProcessor, keys));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendData(entryProcessor);
    clientMessage.appendInt(len(keys))
    for( keysItem in keys) {
    clientMessage.appendData(keysItem);
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
