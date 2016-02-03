import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {CacheMessageType} from './CacheMessageType';

var REQUEST_TYPE = CacheMessageType.CACHE_ADDPARTITIONLOSTLISTENER
var RESPONSE_TYPE = 104
var RETRYABLE = false


export class CacheAddPartitionLostListenerCodec{

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


static handle(clientMessage, handleEventCACHEPARTITIONLOST ){
    // Event handler
    var messageType = clientMessage.getMessageType();
    if ( messageType === EVENT_CACHEPARTITIONLOST && handleEventCACHEPARTITIONLOST !== null) {
    partitionId = clientMessage.readInt();
    uuid = clientMessage.readStr();
        handleEventCACHEPARTITIONLOST(partitionId, uuid)
    }
}
}
