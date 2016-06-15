/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import Address = require('../Address');
import {AddressCodec} from './AddressCodec';
import {MemberCodec} from './MemberCodec';
import {Data} from '../serialization/Data';
import {EntryViewCodec} from './EntryViewCodec';
import DistributedObjectInfoCodec = require('./DistributedObjectInfoCodec');
import {LockMessageType} from './LockMessageType';

var REQUEST_TYPE = LockMessageType.LOCK_GETREMAININGLEASETIME;
var RESPONSE_TYPE = 103;
var RETRYABLE = true;


export class LockGetRemainingLeaseTimeCodec{



static calculateSize(name : string ){
// Calculates the request payload size
var dataSize : number = 0;
            dataSize += BitsUtil.calculateSizeString(name);
return dataSize;
}

static encodeRequest(name : string){
// Encode request into clientMessage
var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name));
clientMessage.setMessageType(REQUEST_TYPE);
clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendString(name);
clientMessage.updateFrameLength();
return clientMessage;
}

static decodeResponse(clientMessage : ClientMessage,  toObjectFunction: (data: Data) => any = null){
// Decode response from client message
var parameters :any = { 'response' : null  };
                    parameters['response'] = clientMessage.readLong();
return parameters;

}


}
