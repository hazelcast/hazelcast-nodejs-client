import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {XATransactionMessageType} from './XATransactionMessageType';

var REQUEST_TYPE = XATransactionMessageType.XATRANSACTION_CLEARREMOTE
var RESPONSE_TYPE = 100
var RETRYABLE = false


export class XATransactionClearRemoteCodec{

constructor() {
}




static calculateSize(xid){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeJavax.transaction.xa.xid(xid);
    return dataSize;
}

static encodeRequest(xid){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(xid));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    XIDCodec.encode(clientMessage, xid);
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;
    return parameters;

}


}
