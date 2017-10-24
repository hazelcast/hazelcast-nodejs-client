/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import Address = require('../Address');
import {AddressCodec} from './AddressCodec';
import {UUIDCodec} from './UUIDCodec';
import {MemberCodec} from './MemberCodec';
import {Data} from '../serialization/Data';
import {EntryViewCodec} from './EntryViewCodec';
import DistributedObjectInfoCodec = require('./DistributedObjectInfoCodec');
import {DynamicConfigMessageType} from './DynamicConfigMessageType';

var REQUEST_TYPE = DynamicConfigMessageType.DYNAMICCONFIG_ADDEVENTJOURNALCONFIG;
var RESPONSE_TYPE = 100;
var RETRYABLE = false;


export class DynamicConfigAddEventJournalConfigCodec {


    static calculateSize(mapName: string, cacheName: string, enabled: boolean, capacity: number, timeToLiveSeconds: number) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (mapName !== null) {
            dataSize += BitsUtil.calculateSizeString(mapName);
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (cacheName !== null) {
            dataSize += BitsUtil.calculateSizeString(cacheName);
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(mapName: string, cacheName: string, enabled: boolean, capacity: number, timeToLiveSeconds: number) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(mapName, cacheName, enabled, capacity, timeToLiveSeconds));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendBoolean(mapName === null);
        if (mapName !== null) {
            clientMessage.appendString(mapName);
        }
        clientMessage.appendBoolean(cacheName === null);
        if (cacheName !== null) {
            clientMessage.appendString(cacheName);
        }
        clientMessage.appendBoolean(enabled);
        clientMessage.appendInt32(capacity);
        clientMessage.appendInt32(timeToLiveSeconds);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

// Empty decodeResponse(ClientMessage), this message has no parameters to decode


}
