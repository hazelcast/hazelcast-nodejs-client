import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {CacheMessageType} from './CacheMessageType';

var REQUEST_TYPE = CacheMessageType.CACHE_ADDINVALIDATIONLISTENER
var RESPONSE_TYPE = 104
var RETRYABLE = false


export class CacheAddInvalidationListenerCodec{

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


static handle(clientMessage, handleEventCACHEINVALIDATION , handleEventCACHEBATCHINVALIDATION ){
    // Event handler
    var messageType = clientMessage.getMessageType();
    if ( messageType === EVENT_CACHEINVALIDATION && handleEventCACHEINVALIDATION !== null) {
    name = clientMessage.readStr();

if(clientMessage.readBool() === true){
    key = clientMessage.readData();
}

if(clientMessage.readBool() === true){
    sourceUuid = clientMessage.readStr();
}
        handleEventCACHEINVALIDATION(name, key, sourceUuid)
    }
    if ( messageType === EVENT_CACHEBATCHINVALIDATION && handleEventCACHEBATCHINVALIDATION !== null) {
    name = clientMessage.readStr();
    keysSize = clientMessage.readInt();
    keys = [];
    for(var keysIndex = 0 ;  keysIndex <= keysSize ; keysIndex++){
    keysItem = clientMessage.readData();
        keys.push(keysItem)
    }

if(clientMessage.readBool() === true){
    sourceUuidsSize = clientMessage.readInt();
    sourceUuids = [];
    for(var sourceUuidsIndex = 0 ;  sourceUuidsIndex <= sourceUuidsSize ; sourceUuidsIndex++){
    sourceUuidsItem = clientMessage.readStr();
        sourceUuids.push(sourceUuidsItem)
    }
}
        handleEventCACHEBATCHINVALIDATION(name, keys, sourceUuids)
    }
}
}
