import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {TransactionalMultiMapMessageType} from './TransactionalMultiMapMessageType';

var REQUEST_TYPE = TransactionalMultiMapMessageType.TRANSACTIONALMULTIMAP_VALUECOUNT
var RESPONSE_TYPE = 102
var RETRYABLE = false


export class TransactionalMultiMapValueCountCodec{

constructor() {
}




static calculateSize(name, txnId, threadId, key){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.calculateSizeStr(txnId);
    dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
    dataSize += BitsUtil.calculateSizeData(key);
    return dataSize;
}

static encodeRequest(name, txnId, threadId, key){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, txnId, threadId, key));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendStr(txnId);
    clientMessage.appendLong(threadId);
    clientMessage.appendData(key);
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;
    parameters['response'] = clientMessage.readInt();
    return parameters;

}


}
