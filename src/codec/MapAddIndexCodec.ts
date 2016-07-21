/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import {MapMessageType} from './MapMessageType';
import Address = require('../Address');
import DistributedObjectInfoCodec = require('./DistributedObjectInfoCodec');

var REQUEST_TYPE = MapMessageType.MAP_ADDINDEX;
var RESPONSE_TYPE = 100;
var RETRYABLE = false;


export class MapAddIndexCodec {


    static calculateSize(name: string, attribute: string, ordered: boolean) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.calculateSizeString(attribute);
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(name: string, attribute: string, ordered: boolean) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, attribute, ordered));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendString(attribute);
        clientMessage.appendBoolean(ordered);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

// Empty decodeResponse(ClientMessage), this message has no parameters to decode


}
