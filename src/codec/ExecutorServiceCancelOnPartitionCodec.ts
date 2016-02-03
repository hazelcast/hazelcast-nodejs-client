import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {ExecutorServiceMessageType} from './ExecutorServiceMessageType';

var REQUEST_TYPE = ExecutorServiceMessageType.EXECUTORSERVICE_CANCELONPARTITION
var RESPONSE_TYPE = 101
var RETRYABLE = false


export class ExecutorServiceCancelOnPartitionCodec{

constructor() {
}




static calculateSize(uuid, partitionId, interrupt){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(uuid);
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    return dataSize;
}

static encodeRequest(uuid, partitionId, interrupt){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(uuid, partitionId, interrupt));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(uuid);
    clientMessage.appendInt(partitionId);
    clientMessage.appendBool(interrupt);
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
