import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {ClientMessageType} from './ClientMessageType';

var REQUEST_TYPE = ClientMessageType.CLIENT_ADDPARTITIONLOSTLISTENER
var RESPONSE_TYPE = 104
var RETRYABLE = false


export class ClientAddPartitionLostListenerCodec{

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


static handle(clientMessage, handleEventPARTITIONLOST ){
    // Event handler
    var messageType = clientMessage.getMessageType();
    if ( messageType === EVENT_PARTITIONLOST && handleEventPARTITIONLOST !== null) {
    partitionId = clientMessage.readInt();
    lostBackupCount = clientMessage.readInt();

if(clientMessage.readBool() === true){
    source = AddressCodec.decode(clientMessage)
}
        handleEventPARTITIONLOST(partitionId, lostBackupCount, source)
    }
}
}
