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

var REQUEST_TYPE = MapMessageType.MAP_LOADGIVENKEYS;
var RESPONSE_TYPE = 100;
var RETRYABLE = false;


export class MapLoadGivenKeysCodec{



static calculateSize(name : string  , keys : any  , replaceExistingValues : boolean ){
// Calculates the request payload size
var dataSize : number = 0;
            dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;

        keys.forEach((keysItem : any) => {
            dataSize += BitsUtil.calculateSizeData(keysItem);
        });
            dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
return dataSize;
}

static encodeRequest(name : string, keys : any, replaceExistingValues : boolean){
// Encode request into clientMessage
var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, keys, replaceExistingValues));
clientMessage.setMessageType(REQUEST_TYPE);
clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendString(name);
    clientMessage.appendInt32(keys.length);

    keys.forEach((keysItem : any) => {
    clientMessage.appendData(keysItem);
    });

    clientMessage.appendBoolean(replaceExistingValues);
clientMessage.updateFrameLength();
return clientMessage;
}

// Empty decodeResponse(ClientMessage), this message has no parameters to decode


}
