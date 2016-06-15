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

var REQUEST_TYPE = LockMessageType.LOCK_UNLOCK;
var RESPONSE_TYPE = 100;
var RETRYABLE = false;


export class LockUnlockCodec{



static calculateSize(name : string  , threadId : any ){
// Calculates the request payload size
var dataSize : number = 0;
            dataSize += BitsUtil.calculateSizeString(name);
            dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
return dataSize;
}

static encodeRequest(name : string, threadId : any){
// Encode request into clientMessage
var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, threadId));
clientMessage.setMessageType(REQUEST_TYPE);
clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendString(name);
    clientMessage.appendLong(threadId);
clientMessage.updateFrameLength();
return clientMessage;
}

// Empty decodeResponse(ClientMessage), this message has no parameters to decode


}
