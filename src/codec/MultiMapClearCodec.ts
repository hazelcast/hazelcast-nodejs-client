/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import {MultiMapMessageType} from './MultiMapMessageType';
import Address = require('../Address');
import DistributedObjectInfoCodec = require('./DistributedObjectInfoCodec');

var REQUEST_TYPE = MultiMapMessageType.MULTIMAP_CLEAR;
var RESPONSE_TYPE = 100;
var RETRYABLE = false;


export class MultiMapClearCodec {


    static calculateSize(name: string) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        return dataSize;
    }

    static encodeRequest(name: string) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

// Empty decodeResponse(ClientMessage), this message has no parameters to decode


}
