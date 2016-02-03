import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {MapMessageType} from './MapMessageType';

var REQUEST_TYPE = MapMessageType.MAP_ADDENTRYLISTENER
var RESPONSE_TYPE = 104
var RETRYABLE = false


export class MapAddEntryListenerCodec{

constructor() {
}




static calculateSize(name, includeValue, listenerFlags, localOnly){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    return dataSize;
}

static encodeRequest(name, includeValue, listenerFlags, localOnly){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, includeValue, listenerFlags, localOnly));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendBool(includeValue);
    clientMessage.appendInt(listenerFlags);
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


static handle(clientMessage, handleEventENTRY ){
    // Event handler
    var messageType = clientMessage.getMessageType();
    if ( messageType === EVENT_ENTRY && handleEventENTRY !== null) {

if(clientMessage.readBool() === true){
    key = clientMessage.readData();
}

if(clientMessage.readBool() === true){
    value = clientMessage.readData();
}

if(clientMessage.readBool() === true){
    oldValue = clientMessage.readData();
}

if(clientMessage.readBool() === true){
    mergingValue = clientMessage.readData();
}
    eventType = clientMessage.readInt();
    uuid = clientMessage.readStr();
    numberOfAffectedEntries = clientMessage.readInt();
        handleEventENTRY(key, value, oldValue, mergingValue, eventType, uuid, numberOfAffectedEntries)
    }
}
}
