import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {MapMessageType} from './MapMessageType';

var REQUEST_TYPE = MapMessageType.MAP_ADDPARTITIONLOSTLISTENER
var RESPONSE_TYPE = 104
var RETRYABLE = false


export class MapAddPartitionLostListenerCodec{

constructor() {
}




static calculateSize(name, localOnly){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    return dataSize;
}

static encodeRequest(name, localOnly){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, localOnly));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
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


static handle(clientMessage, handleEventMAPPARTITIONLOST ){
    // Event handler
    var messageType = clientMessage.getMessageType();
    if ( messageType === EVENT_MAPPARTITIONLOST && handleEventMAPPARTITIONLOST !== null) {
    partitionId = clientMessage.readInt();
    uuid = clientMessage.readStr();
        handleEventMAPPARTITIONLOST(partitionId, uuid)
    }
}
}
