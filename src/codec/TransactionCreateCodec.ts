import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {TransactionMessageType} from './TransactionMessageType';

var REQUEST_TYPE = TransactionMessageType.TRANSACTION_CREATE
var RESPONSE_TYPE = 104
var RETRYABLE = false


export class TransactionCreateCodec{

constructor() {
}




static calculateSize(timeout, durability, transactionType, threadId){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
    return dataSize;
}

static encodeRequest(timeout, durability, transactionType, threadId){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(timeout, durability, transactionType, threadId));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendLong(timeout);
    clientMessage.appendInt(durability);
    clientMessage.appendInt(transactionType);
    clientMessage.appendLong(threadId);
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;
    parameters['response'] = clientMessage.readStr();
    return parameters;

}


}
