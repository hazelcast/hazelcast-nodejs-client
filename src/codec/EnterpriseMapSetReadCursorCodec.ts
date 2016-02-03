import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {EnterpriseMapMessageType} from './EnterpriseMapMessageType';

var REQUEST_TYPE = EnterpriseMapMessageType.ENTERPRISEMAP_SETREADCURSOR
var RESPONSE_TYPE = 101
var RETRYABLE = false


export class EnterpriseMapSetReadCursorCodec{

constructor() {
}




static calculateSize(mapName, cacheName, sequence){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(mapName);
    dataSize += BitsUtil.calculateSizeStr(cacheName);
    dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
    return dataSize;
}

static encodeRequest(mapName, cacheName, sequence){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(mapName, cacheName, sequence));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(mapName);
    clientMessage.appendStr(cacheName);
    clientMessage.appendLong(sequence);
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;
    parameters['response'] = clientMessage.readBool();
    return parameters;

}


}
