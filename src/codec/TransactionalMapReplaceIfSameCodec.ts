import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {TransactionalMapMessageType} from './TransactionalMapMessageType';

var REQUEST_TYPE = TransactionalMapMessageType.TRANSACTIONALMAP_REPLACEIFSAME
var RESPONSE_TYPE = 101
var RETRYABLE = false


export class TransactionalMapReplaceIfSameCodec{

constructor() {
}




static calculateSize(name, txnId, threadId, key, oldValue, newValue){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.calculateSizeStr(txnId);
    dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
    dataSize += BitsUtil.calculateSizeData(key);
    dataSize += BitsUtil.calculateSizeData(oldValue);
    dataSize += BitsUtil.calculateSizeData(newValue);
    return dataSize;
}

static encodeRequest(name, txnId, threadId, key, oldValue, newValue){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, txnId, threadId, key, oldValue, newValue));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendStr(txnId);
    clientMessage.appendLong(threadId);
    clientMessage.appendData(key);
    clientMessage.appendData(oldValue);
    clientMessage.appendData(newValue);
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
