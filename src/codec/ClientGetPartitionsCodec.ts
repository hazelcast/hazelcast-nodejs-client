import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {ClientMessageType} from './ClientMessageType';

var REQUEST_TYPE = ClientMessageType.CLIENT_GETPARTITIONS
var RESPONSE_TYPE = 108
var RETRYABLE = false


export class ClientGetPartitionsCodec{

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
    partitionsSize = clientMessage.readInt();
    partitions = [];
for(var partitionsIndex = 0 ;  partitionsIndex <= partitionsSize ; partitionsIndex++){
    partitionsKey = AddressCodec.decode(clientMessage)
    partitionsValSize = clientMessage.readInt();
    partitionsVal = [];
    for(var partitionsValIndex = 0 ;  partitionsValIndex <= partitionsValSize ; partitionsValIndex++){
    partitionsValItem = clientMessage.readInt();
        partitionsVal.push(partitionsValItem)
    }
        partitions[partitionsKey] = partitionsVal
        parameters['partitions'] = partitions
}
    return parameters;

}


}
