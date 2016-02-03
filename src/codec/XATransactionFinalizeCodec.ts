import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {XATransactionMessageType} from './XATransactionMessageType';

var REQUEST_TYPE = XATransactionMessageType.XATRANSACTION_FINALIZE
var RESPONSE_TYPE = 100
var RETRYABLE = false


export class XATransactionFinalizeCodec{

constructor() {
}




static calculateSize(xid, isCommit){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeJavax.transaction.xa.xid(xid);
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    return dataSize;
}

static encodeRequest(xid, isCommit){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(xid, isCommit));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    XIDCodec.encode(clientMessage, xid);
    clientMessage.appendBool(isCommit);
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;
    return parameters;

}


}
