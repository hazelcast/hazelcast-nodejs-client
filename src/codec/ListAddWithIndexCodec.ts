import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {ListMessageType} from './ListMessageType';

var REQUEST_TYPE = ListMessageType.LIST_ADDWITHINDEX
var RESPONSE_TYPE = 100
var RETRYABLE = false


export class ListAddWithIndexCodec{

constructor() {
}




static calculateSize(name, index, value){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    dataSize += BitsUtil.calculateSizeData(value);
    return dataSize;
}

static encodeRequest(name, index, value){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, index, value));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendInt(index);
    clientMessage.appendData(value);
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;
    return parameters;

}


}
