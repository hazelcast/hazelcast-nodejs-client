import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {RingbufferMessageType} from './RingbufferMessageType';

var REQUEST_TYPE = RingbufferMessageType.RINGBUFFER_READMANY
var RESPONSE_TYPE = 115
var RETRYABLE = false


export class RingbufferReadManyCodec{

constructor() {
}




static calculateSize(name, startSequence, minCount, maxCount, filter){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    dataSize += BitsUtil.INT_SIZE_IN_BYTES;
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    if(filter !== null) {
    dataSize += BitsUtil.calculateSizeData(filter);
    }
    return dataSize;
}

static encodeRequest(name, startSequence, minCount, maxCount, filter){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, startSequence, minCount, maxCount, filter));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendLong(startSequence);
    clientMessage.appendInt(minCount);
    clientMessage.appendInt(maxCount);
    clientMessage.appendBool(filter === null);
    if(filter !== null){
    clientMessage.appendData(filter);
    }
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;
    parameters['readCount'] = clientMessage.readInt();
    itemsSize = clientMessage.readInt();
    items = [];
    for(var itemsIndex = 0 ;  itemsIndex <= itemsSize ; itemsIndex++){
    itemsItem = clientMessage.readData();
        items.push(itemsItem)
    }
    parameters['items'] = items
    return parameters;

}


}
