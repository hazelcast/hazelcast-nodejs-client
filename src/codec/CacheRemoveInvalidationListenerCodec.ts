import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {CacheMessageType} from './CacheMessageType';

var REQUEST_TYPE = CacheMessageType.CACHE_REMOVEINVALIDATIONLISTENER
var RESPONSE_TYPE = 101
var RETRYABLE = true


export class CacheRemoveInvalidationListenerCodec{

constructor() {
}




static calculateSize(name, registrationId){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.calculateSizeStr(registrationId);
    return dataSize;
}

static encodeRequest(name, registrationId){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, registrationId));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendStr(registrationId);
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
