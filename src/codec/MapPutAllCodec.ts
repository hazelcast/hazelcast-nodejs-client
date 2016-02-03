import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {MapMessageType} from './MapMessageType';

var REQUEST_TYPE = MapMessageType.MAP_PUTALL
var RESPONSE_TYPE = 100
var RETRYABLE = false


export class MapPutAllCodec{

constructor() {
}




static calculateSize(name, entries){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    for( entry in entries){
    dataSize += BitsUtil.calculateSizeData(entry.key);
    dataSize += BitsUtil.calculateSizeData(entry.val);
    }
    return dataSize;
}

static encodeRequest(name, entries){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, entries));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendInt(len(entries))
    for( entry in entries){
    clientMessage.appendData(entry.key);
    clientMessage.appendData(entry.val);
    }
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;
    return parameters;

}


}
