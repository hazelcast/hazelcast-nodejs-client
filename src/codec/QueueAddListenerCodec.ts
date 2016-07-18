/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import Address = require('../Address');
import {AddressCodec} from './AddressCodec';
import {MemberCodec} from './MemberCodec';
import {Data} from '../serialization/Data';
import {EntryViewCodec} from './EntryViewCodec';
import DistributedObjectInfoCodec = require('./DistributedObjectInfoCodec');
import {QueueMessageType} from './QueueMessageType';

var REQUEST_TYPE = QueueMessageType.QUEUE_ADDLISTENER;
var RESPONSE_TYPE = 104;
var RETRYABLE = false;


export class QueueAddListenerCodec{



static calculateSize(name : string  , includeValue : boolean  , localOnly : boolean ){
// Calculates the request payload size
var dataSize : number = 0;
            dataSize += BitsUtil.calculateSizeString(name);
            dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
            dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
return dataSize;
}

static encodeRequest(name : string, includeValue : boolean, localOnly : boolean){
// Encode request into clientMessage
var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, includeValue, localOnly));
clientMessage.setMessageType(REQUEST_TYPE);
clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendString(name);
    clientMessage.appendBoolean(includeValue);
    clientMessage.appendBoolean(localOnly);
clientMessage.updateFrameLength();
return clientMessage;
}

static decodeResponse(clientMessage : ClientMessage,  toObjectFunction: (data: Data) => any = null){
// Decode response from client message
var parameters :any = { 'response' : null  };
                    parameters['response'] = clientMessage.readString();
return parameters;

}

static handle(clientMessage : ClientMessage, handleEventItem : any ,toObjectFunction: (data: Data) => any = null){

var messageType = clientMessage.getMessageType();
    if ( messageType === BitsUtil.EVENT_ITEM && handleEventItem !== null) {
        var item : Data;

    if(clientMessage.readBoolean() !== true){
                    item = clientMessage.readData();
    }
        var uuid : string;
                    uuid = clientMessage.readString();
        var eventType : number;
                    eventType = clientMessage.readInt32();
    handleEventItem(item, uuid, eventType);
    }
}

}
