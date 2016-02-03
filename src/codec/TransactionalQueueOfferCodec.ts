import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {TransactionalQueueMessageType} from './TransactionalQueueMessageType';

var REQUEST_TYPE = TransactionalQueueMessageType.TRANSACTIONALQUEUE_OFFER
var RESPONSE_TYPE = 101
var RETRYABLE = false


export class TransactionalQueueOfferCodec{

constructor() {
}




static calculateSize(name, txnId, threadId, item, timeout){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.calculateSizeStr(txnId);
    dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
    dataSize += BitsUtil.calculateSizeData(item);
    dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
    return dataSize;
}

static encodeRequest(name, txnId, threadId, item, timeout){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, txnId, threadId, item, timeout));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendStr(txnId);
    clientMessage.appendLong(threadId);
    clientMessage.appendData(item);
    clientMessage.appendLong(timeout);
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
