import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {TransactionalMapMessageType} from './TransactionalMapMessageType';

var REQUEST_TYPE = TransactionalMapMessageType.TRANSACTIONALMAP_KEYSETWITHPREDICATE
var RESPONSE_TYPE = 106
var RETRYABLE = false


export class TransactionalMapKeySetWithPredicateCodec{

constructor() {
}




static calculateSize(name, txnId, threadId, predicate){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.calculateSizeStr(txnId);
    dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
    dataSize += BitsUtil.calculateSizeData(predicate);
    return dataSize;
}

static encodeRequest(name, txnId, threadId, predicate){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, txnId, threadId, predicate));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendStr(txnId);
    clientMessage.appendLong(threadId);
    clientMessage.appendData(predicate);
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
