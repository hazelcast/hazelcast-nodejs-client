import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {EnterpriseMapMessageType} from './EnterpriseMapMessageType';

var REQUEST_TYPE = EnterpriseMapMessageType.ENTERPRISEMAP_DESTROYCACHE
var RESPONSE_TYPE = 101
var RETRYABLE = false


export class EnterpriseMapDestroyCacheCodec{

constructor() {
}




static calculateSize(mapName, cacheName){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(mapName);
    dataSize += BitsUtil.calculateSizeStr(cacheName);
    return dataSize;
}

static encodeRequest(mapName, cacheName){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(mapName, cacheName));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(mapName);
    clientMessage.appendStr(cacheName);
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
