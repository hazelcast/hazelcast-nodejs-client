import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {MapReduceMessageType} from './MapReduceMessageType';

var REQUEST_TYPE = MapReduceMessageType.MAPREDUCE_FORMULTIMAP
var RESPONSE_TYPE = 117
var RETRYABLE = false


export class MapReduceForMultiMapCodec{

constructor() {
}




static calculateSize(name, jobId, predicate, mapper, combinerFactory, reducerFactory, multiMapName, chunkSize, keys, topologyChangedStrategy){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.calculateSizeStr(jobId);
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    if(predicate !== null) {
    dataSize += BitsUtil.calculateSizeData(predicate);
    }
    dataSize += BitsUtil.calculateSizeData(mapper);
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    if(combinerFactory !== null) {
    dataSize += BitsUtil.calculateSizeData(combinerFactory);
    }
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    if(reducerFactory !== null) {
    dataSize += BitsUtil.calculateSizeData(reducerFactory);
    }
    dataSize += BitsUtil.calculateSizeStr(multiMapName);
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    if(keys !== null) {
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    for( keysItem in keys){
    dataSize += BitsUtil.calculateSizeData(keysItem);
    }
    }
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    if(topologyChangedStrategy !== null) {
    dataSize += BitsUtil.calculateSizeStr(topologyChangedStrategy);
    }
    return dataSize;
}

static encodeRequest(name, jobId, predicate, mapper, combinerFactory, reducerFactory, multiMapName, chunkSize, keys, topologyChangedStrategy){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, jobId, predicate, mapper, combinerFactory, reducerFactory, multiMapName, chunkSize, keys, topologyChangedStrategy));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendStr(jobId);
    clientMessage.appendBool(predicate === null);
    if(predicate !== null){
    clientMessage.appendData(predicate);
    }
    clientMessage.appendData(mapper);
    clientMessage.appendBool(combinerFactory === null);
    if(combinerFactory !== null){
    clientMessage.appendData(combinerFactory);
    }
    clientMessage.appendBool(reducerFactory === null);
    if(reducerFactory !== null){
    clientMessage.appendData(reducerFactory);
    }
    clientMessage.appendStr(multiMapName);
    clientMessage.appendInt(chunkSize);
    clientMessage.appendBool(keys === null);
    if(keys !== null){
    clientMessage.appendInt(len(keys))
    for( keysItem in keys) {
    clientMessage.appendData(keysItem);
    }
    }
    clientMessage.appendBool(topologyChangedStrategy === null);
    if(topologyChangedStrategy !== null){
    clientMessage.appendStr(topologyChangedStrategy);
    }
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;
    responseSize = clientMessage.readInt();
    response = [];
    for(var responseIndex = 0 ;  responseIndex <= responseSize ; responseIndex++){
    responseItem = clientMessage.readMapEntry();
        response.push(responseItem)
    }
    parameters['response'] = response
    return parameters;

}


}
