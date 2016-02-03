import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {TransactionalQueueMessageType} from './TransactionalQueueMessageType';

var REQUEST_TYPE = TransactionalQueueMessageType.TRANSACTIONALQUEUE_TAKE
var RESPONSE_TYPE = 105
var RETRYABLE = false


export class TransactionalQueueTakeCodec{

constructor() {
}




static calculateSize(name, txnId, threadId){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.calculateSizeStr(txnId);
    dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
    return dataSize;
}

static encodeRequest(name, txnId, threadId){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, txnId, threadId));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendStr(txnId);
    clientMessage.appendLong(threadId);
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;

if(clientMessage.readBool() === true){
    parameters['response'] = clientMessage.readData();
}
    return parameters;

}


}
