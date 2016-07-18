/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import Address = require('../Address');
import {AddressCodec} from './AddressCodec';
import {MemberCodec} from './MemberCodec';
import {Data} from '../serialization/Data';
import {EntryViewCodec} from './EntryViewCodec';
import DistributedObjectInfoCodec = require('./DistributedObjectInfoCodec');
import {MapMessageType} from './MapMessageType';

var REQUEST_TYPE = MapMessageType.MAP_PUTIFABSENT;
var RESPONSE_TYPE = 105;
var RETRYABLE = false;


export class MapPutIfAbsentCodec{



static calculateSize(name : string  , key : Data  , value : Data  , threadId : any  , ttl : any ){
// Calculates the request payload size
var dataSize : number = 0;
            dataSize += BitsUtil.calculateSizeString(name);
            dataSize += BitsUtil.calculateSizeData(key);
            dataSize += BitsUtil.calculateSizeData(value);
            dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
            dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
return dataSize;
}

static encodeRequest(name : string, key : Data, value : Data, threadId : any, ttl : any){
// Encode request into clientMessage
var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, key, value, threadId, ttl));
clientMessage.setMessageType(REQUEST_TYPE);
clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendString(name);
    clientMessage.appendData(key);
    clientMessage.appendData(value);
    clientMessage.appendLong(threadId);
    clientMessage.appendLong(ttl);
clientMessage.updateFrameLength();
return clientMessage;
}

static decodeResponse(clientMessage : ClientMessage,  toObjectFunction: (data: Data) => any = null){
// Decode response from client message
var parameters :any = { 'response' : null  };

    if(clientMessage.readBoolean() !== true){
                    parameters['response'] = toObjectFunction(clientMessage.readData());
    }
return parameters;

}


}
