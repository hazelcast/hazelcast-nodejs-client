import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {SetMessageType} from './SetMessageType';

var REQUEST_TYPE = SetMessageType.SET_CONTAINSALL
var RESPONSE_TYPE = 101
var RETRYABLE = false


export class SetContainsAllCodec{

constructor() {
}




static calculateSize(name, items){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    for( itemsItem in items){
    dataSize += BitsUtil.calculateSizeData(itemsItem);
    }
    return dataSize;
}

static encodeRequest(name, items){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, items));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendInt(len(items))
    for( itemsItem in items) {
    clientMessage.appendData(itemsItem);
    }
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
