import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {ClientMessageType} from './ClientMessageType';

var REQUEST_TYPE = ClientMessageType.CLIENT_ADDDISTRIBUTEDOBJECTLISTENER
var RESPONSE_TYPE = 104
var RETRYABLE = false


export class ClientAddDistributedObjectListenerCodec{

constructor() {
}




static calculateSize(localOnly){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    return dataSize;
}

static encodeRequest(localOnly){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(localOnly));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendBool(localOnly);
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;
    parameters['response'] = clientMessage.readStr();
    return parameters;

}


static handle(clientMessage, handleEventDISTRIBUTEDOBJECT ){
    // Event handler
    var messageType = clientMessage.getMessageType();
    if ( messageType === EVENT_DISTRIBUTEDOBJECT && handleEventDISTRIBUTEDOBJECT !== null) {
    name = clientMessage.readStr();
    serviceName = clientMessage.readStr();
    eventType = clientMessage.readStr();
        handleEventDISTRIBUTEDOBJECT(name, serviceName, eventType)
    }
}
}
