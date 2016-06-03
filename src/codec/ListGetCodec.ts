/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import Address = require('../Address');
import {AddressCodec} from './AddressCodec';
import {MemberCodec} from './MemberCodec';
import {Data} from '../serialization/Data';
import {EntryViewCodec} from './EntryViewCodec';
import DistributedObjectInfoCodec = require('./DistributedObjectInfoCodec');
import {ListMessageType} from './ListMessageType';

var REQUEST_TYPE = ListMessageType.LIST_GET;
var RESPONSE_TYPE = 105;
var RETRYABLE = true;


export class ListGetCodec{



static calculateSize(name : string  , index : number ){
// Calculates the request payload size
var dataSize : number = 0;
            dataSize += BitsUtil.calculateSizeString(name);
            dataSize += BitsUtil.INT_SIZE_IN_BYTES;
return dataSize;
}

static encodeRequest(name : string, index : number){
// Encode request into clientMessage
var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, index));
clientMessage.setMessageType(REQUEST_TYPE);
clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendString(name);
    clientMessage.appendInt32(index);
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
