import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {QueueMessageType} from './QueueMessageType';

var REQUEST_TYPE = QueueMessageType.QUEUE_COMPAREANDREMOVEALL
var RESPONSE_TYPE = 101
var RETRYABLE = false


export class QueueCompareAndRemoveAllCodec{

constructor() {
}




static calculateSize(name, dataList){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    for( dataListItem in dataList){
    dataSize += BitsUtil.calculateSizeData(dataListItem);
    }
    return dataSize;
}

static encodeRequest(name, dataList){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, dataList));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendInt(len(dataList))
    for( dataListItem in dataList) {
    clientMessage.appendData(dataListItem);
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
