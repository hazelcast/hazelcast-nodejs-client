import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {ConditionMessageType} from './ConditionMessageType';

var REQUEST_TYPE = ConditionMessageType.CONDITION_SIGNALALL
var RESPONSE_TYPE = 100
var RETRYABLE = false


export class ConditionSignalAllCodec{

constructor() {
}




static calculateSize(name, threadId, lockName){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
    dataSize += BitsUtil.calculateSizeStr(lockName);
    return dataSize;
}

static encodeRequest(name, threadId, lockName){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, threadId, lockName));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendLong(threadId);
    clientMessage.appendStr(lockName);
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;
    return parameters;

}


}
