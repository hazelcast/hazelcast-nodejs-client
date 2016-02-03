import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {MapMessageType} from './MapMessageType';

var REQUEST_TYPE = MapMessageType.MAP_ADDNEARCACHEENTRYLISTENER
var RESPONSE_TYPE = 104
var RETRYABLE = false


export class MapAddNearCacheEntryListenerCodec{

constructor() {
}




static calculateSize(name, listenerFlags, localOnly){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    return dataSize;
}

static encodeRequest(name, listenerFlags, localOnly){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, listenerFlags, localOnly));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
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


static handle(clientMessage, handleEventIMAPINVALIDATION , handleEventIMAPBATCHINVALIDATION ){
    // Event handler
    var messageType = clientMessage.getMessageType();
    if ( messageType === EVENT_IMAPINVALIDATION && handleEventIMAPINVALIDATION !== null) {

if(clientMessage.readBool() === true){
    key = clientMessage.readData();
}
        handleEventIMAPINVALIDATION(key)
    }
    if ( messageType === EVENT_IMAPBATCHINVALIDATION && handleEventIMAPBATCHINVALIDATION !== null) {
    keysSize = clientMessage.readInt();
    keys = [];
    for(var keysIndex = 0 ;  keysIndex <= keysSize ; keysIndex++){
    keysItem = clientMessage.readData();
        keys.push(keysItem)
    }
        handleEventIMAPBATCHINVALIDATION(keys)
    }
}
}
