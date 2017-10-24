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
import {MapMessageType} from './MapMessageType';

var REQUEST_TYPE = MapMessageType.MAP_PUTALL;
var RESPONSE_TYPE = 100;
var RETRYABLE = false;


export class MapPutAllCodec {


    static calculateSize(name: string, entries: any) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;

        entries.forEach((entriesItem: any) => {
            var key: Data = entriesItem[0];
            var val: Data = entriesItem[1];
            dataSize += BitsUtil.calculateSizeData(key);
            dataSize += BitsUtil.calculateSizeData(val);
        });
        return dataSize;
    }

    static encodeRequest(name: string, entries: any) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, entries));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendInt32(entries.length);

        entries.forEach((entriesItem: any) => {
            var key: Data = entriesItem[0];
            var val: Data = entriesItem[1];
            clientMessage.appendData(key);
            clientMessage.appendData(val);
        });

        clientMessage.updateFrameLength();
        return clientMessage;
    }

// Empty decodeResponse(ClientMessage), this message has no parameters to decode


}
