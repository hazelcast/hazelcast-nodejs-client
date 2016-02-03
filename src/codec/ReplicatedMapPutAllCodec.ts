import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {ReplicatedMapMessageType} from './ReplicatedMapMessageType';

var REQUEST_TYPE = ReplicatedMapMessageType.REPLICATEDMAP_PUTALL
var RESPONSE_TYPE = 100
var RETRYABLE = false


export class ReplicatedMapPutAllCodec{

constructor() {
}




static calculateSize(name, entries){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    for( entriesItem in entries){
    dataSize += BitsUtil.calculateSizeJava.util.map.entry<data, data >(entriesItem);
    }
    return dataSize;
}

static encodeRequest(name, entries){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, entries));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendInt(len(entries))
    for( entriesItem in entries) {
    clientMessage.appendJava.util.map.entry<data, data >(entriesItem);
    }
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;
    return parameters;

}


}
