/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import {Data} from '../serialization/Data';
import {MultiMapMessageType} from './MultiMapMessageType';
import Address = require('../Address');
import DistributedObjectInfoCodec = require('./DistributedObjectInfoCodec');

var REQUEST_TYPE = MultiMapMessageType.MULTIMAP_LOCK;
var RESPONSE_TYPE = 100;
var RETRYABLE = false;


export class MultiMapLockCodec {


    static calculateSize(name: string, key: Data, threadId: any, ttl: any) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.calculateSizeData(key);
        dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
        dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(name: string, key: Data, threadId: any, ttl: any) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, key, threadId, ttl));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendData(key);
        clientMessage.appendLong(threadId);
        clientMessage.appendLong(ttl);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

// Empty decodeResponse(ClientMessage), this message has no parameters to decode


}
