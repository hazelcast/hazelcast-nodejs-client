import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {MapMessageType} from './MapMessageType';

var REQUEST_TYPE = MapMessageType.MAP_LOADGIVENKEYS
var RESPONSE_TYPE = 100
var RETRYABLE = false


export class MapLoadGivenKeysCodec{

constructor() {
}




static calculateSize(name, keys, replaceExistingValues){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    for( keysItem in keys){
    dataSize += BitsUtil.calculateSizeData(keysItem);
    }
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    return dataSize;
}

static encodeRequest(name, keys, replaceExistingValues){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, keys, replaceExistingValues));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendInt(len(keys))
    for( keysItem in keys) {
    clientMessage.appendData(keysItem);
    }
    clientMessage.appendBool(replaceExistingValues);
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;
    return parameters;

}


}
