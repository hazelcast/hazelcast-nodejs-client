import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {ReplicatedMapMessageType} from './ReplicatedMapMessageType';

var REQUEST_TYPE = ReplicatedMapMessageType.REPLICATEDMAP_ENTRYSET
var RESPONSE_TYPE = 117
var RETRYABLE = true


export class ReplicatedMapEntrySetCodec{

constructor() {
}




static calculateSize(name){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    return dataSize;
}

static encodeRequest(name){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;
    responseSize = clientMessage.readInt();
    response = [];
    for(var responseIndex = 0 ;  responseIndex <= responseSize ; responseIndex++){
    responseItem = clientMessage.readMapEntry();
        response.push(responseItem)
    }
    parameters['response'] = response
    return parameters;

}


}
