import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {EnterpriseMapMessageType} from './EnterpriseMapMessageType';

var REQUEST_TYPE = EnterpriseMapMessageType.ENTERPRISEMAP_ADDLISTENER
var RESPONSE_TYPE = 104
var RETRYABLE = false


export class EnterpriseMapAddListenerCodec{

constructor() {
}




static calculateSize(listenerName, localOnly){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(listenerName);
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    return dataSize;
}

static encodeRequest(listenerName, localOnly){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(listenerName, localOnly));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(listenerName);
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


static handle(clientMessage, handleEventQUERYCACHESINGLE , handleEventQUERYCACHEBATCH ){
    // Event handler
    var messageType = clientMessage.getMessageType();
    if ( messageType === EVENT_QUERYCACHESINGLE && handleEventQUERYCACHESINGLE !== null) {
    data = QueryCacheEventDataCodec.decode(clientMessage)
        handleEventQUERYCACHESINGLE(data)
    }
    if ( messageType === EVENT_QUERYCACHEBATCH && handleEventQUERYCACHEBATCH !== null) {
    eventsSize = clientMessage.readInt();
    events = [];
    for(var eventsIndex = 0 ;  eventsIndex <= eventsSize ; eventsIndex++){
    eventsItem = QueryCacheEventDataCodec.decode(clientMessage)
        events.push(eventsItem)
    }
    source = clientMessage.readStr();
    partitionId = clientMessage.readInt();
        handleEventQUERYCACHEBATCH(events, source, partitionId)
    }
}
}
