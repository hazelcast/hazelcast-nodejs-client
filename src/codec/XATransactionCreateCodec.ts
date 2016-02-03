import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {XATransactionMessageType} from './XATransactionMessageType';

var REQUEST_TYPE = XATransactionMessageType.XATRANSACTION_CREATE
var RESPONSE_TYPE = 104
var RETRYABLE = false


export class XATransactionCreateCodec{

constructor() {
}




static calculateSize(xid, timeout){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeJavax.transaction.xa.xid(xid);
    dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
    return dataSize;
}

static encodeRequest(xid, timeout){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(xid, timeout));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    XIDCodec.encode(clientMessage, xid);
    clientMessage.appendLong(timeout);
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
