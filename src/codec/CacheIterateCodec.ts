import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {CacheMessageType} from './CacheMessageType';

var REQUEST_TYPE = CacheMessageType.CACHE_ITERATE
var RESPONSE_TYPE = 116
var RETRYABLE = false


export class CacheIterateCodec{

constructor() {
}




static calculateSize(name, partitionId, tableIndex, batch){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    return dataSize;
}

static encodeRequest(name, partitionId, tableIndex, batch){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, partitionId, tableIndex, batch));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendInt(partitionId);
    clientMessage.appendInt(tableIndex);
    clientMessage.appendInt(batch);
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;
    parameters['tableIndex'] = clientMessage.readInt();
    keysSize = clientMessage.readInt();
    keys = [];
    for(var keysIndex = 0 ;  keysIndex <= keysSize ; keysIndex++){
    keysItem = clientMessage.readData();
        keys.push(keysItem)
    }
    parameters['keys'] = keys
    return parameters;

}


}
