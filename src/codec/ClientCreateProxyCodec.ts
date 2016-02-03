import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {ClientMessageType} from './ClientMessageType';

var REQUEST_TYPE = ClientMessageType.CLIENT_CREATEPROXY
var RESPONSE_TYPE = 100
var RETRYABLE = false


export class ClientCreateProxyCodec{

constructor() {
}




static calculateSize(name, serviceName, target){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.calculateSizeStr(serviceName);
    dataSize += BitsUtil.calculateSizeCom.hazelcast.nio.address(target);
    return dataSize;
}

static encodeRequest(name, serviceName, target){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, serviceName, target));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendStr(serviceName);
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
