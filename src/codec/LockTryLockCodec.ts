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

var REQUEST_TYPE = LockMessageType.LOCK_TRYLOCK;
var RESPONSE_TYPE = 101;
var RETRYABLE = false;


export class LockTryLockCodec{



static calculateSize(name : string  , threadId : any  , lease : any  , timeout : any ){
// Calculates the request payload size
var dataSize : number = 0;
            dataSize += BitsUtil.calculateSizeString(name);
            dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
            dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
            dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
return dataSize;
}

static encodeRequest(name : string, threadId : any, lease : any, timeout : any){
// Encode request into clientMessage
var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, threadId, lease, timeout));
clientMessage.setMessageType(REQUEST_TYPE);
clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendString(name);
    clientMessage.appendLong(threadId);
    clientMessage.appendLong(lease);
    clientMessage.appendLong(timeout);
clientMessage.updateFrameLength();
return clientMessage;
}

static decodeResponse(clientMessage : ClientMessage,  toObjectFunction: (data: Data) => any = null){
// Decode response from client message
var parameters :any = { 'response' : null  };
                    parameters['response'] = clientMessage.readBoolean();
return parameters;

}


}
