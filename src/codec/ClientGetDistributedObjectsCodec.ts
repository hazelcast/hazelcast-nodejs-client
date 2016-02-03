import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {ClientMessageType} from './ClientMessageType';

var REQUEST_TYPE = ClientMessageType.CLIENT_GETDISTRIBUTEDOBJECTS
var RESPONSE_TYPE = 110
var RETRYABLE = false


export class ClientGetDistributedObjectsCodec{

constructor() {
}




static calculateSize(){
    // Calculates the request payload size
    var dataSize = 0;
    return dataSize;
}

static encodeRequest(){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize());
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;
    responseSize = clientMessage.readInt();
    response = [];
    for(var responseIndex = 0 ;  responseIndex <= responseSize ; responseIndex++){
    responseItem = DistributedObjectInfoCodec.decode(clientMessage)
        response.push(responseItem)
    }
    parameters['response'] = response
    return parameters;

}


}
