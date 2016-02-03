import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {ListMessageType} from './ListMessageType';

var REQUEST_TYPE = ListMessageType.LIST_LISTITERATOR
var RESPONSE_TYPE = 106
var RETRYABLE = true


export class ListListIteratorCodec{

constructor() {
}




static calculateSize(name, index){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    return dataSize;
}

static encodeRequest(name, index){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, index));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendInt(index);
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;
    responseSize = clientMessage.readInt();
    response = [];
    for(var responseIndex = 0 ;  responseIndex <= responseSize ; responseIndex++){
    responseItem = clientMessage.readData();
        response.push(responseItem)
    }
    parameters['response'] = response
    return parameters;

}


}
