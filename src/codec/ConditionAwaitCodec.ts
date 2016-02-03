import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {ConditionMessageType} from './ConditionMessageType';

var REQUEST_TYPE = ConditionMessageType.CONDITION_AWAIT
var RESPONSE_TYPE = 101
var RETRYABLE = false


export class ConditionAwaitCodec{

constructor() {
}




static calculateSize(name, threadId, timeout, lockName){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
    dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
    dataSize += BitsUtil.calculateSizeStr(lockName);
    return dataSize;
}

static encodeRequest(name, threadId, timeout, lockName){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, threadId, timeout, lockName));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendLong(threadId);
    clientMessage.appendLong(timeout);
    clientMessage.appendStr(lockName);
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
