import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {MapMessageType} from './MapMessageType';

var REQUEST_TYPE = MapMessageType.MAP_CLEARNEARCACHE
var RESPONSE_TYPE = 100
var RETRYABLE = false


export class MapClearNearCacheCodec{

constructor() {
}




static calculateSize(name, target){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.calculateSizeCom.hazelcast.nio.address(target);
    return dataSize;
}

static encodeRequest(name, target){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, target));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    AddressCodec.encode(clientMessage, target);
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;
    return parameters;

}


}
