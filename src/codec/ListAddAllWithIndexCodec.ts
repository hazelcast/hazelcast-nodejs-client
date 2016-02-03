import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {ListMessageType} from './ListMessageType';

var REQUEST_TYPE = ListMessageType.LIST_ADDALLWITHINDEX
var RESPONSE_TYPE = 101
var RETRYABLE = false


export class ListAddAllWithIndexCodec{

constructor() {
}




static calculateSize(name, index, valueList){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    for( valueListItem in valueList){
    dataSize += BitsUtil.calculateSizeData(valueListItem);
    }
    return dataSize;
}

static encodeRequest(name, index, valueList){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, index, valueList));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendInt(index);
    clientMessage.appendInt(len(valueList))
    for( valueListItem in valueList) {
    clientMessage.appendData(valueListItem);
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
