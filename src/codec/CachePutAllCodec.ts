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
import {CacheMessageType} from './CacheMessageType';

var REQUEST_TYPE = CacheMessageType.CACHE_PUTALL;
var RESPONSE_TYPE = 100;
var RETRYABLE = false;


export class CachePutAllCodec {


    static calculateSize(name: string, entries: any, expiryPolicy: Data, completionId: number) {
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
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (expiryPolicy !== null) {
            dataSize += BitsUtil.calculateSizeData(expiryPolicy);
        }
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(name: string, entries: any, expiryPolicy: Data, completionId: number) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, entries, expiryPolicy, completionId));
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

        clientMessage.appendBoolean(expiryPolicy === null);
        if (expiryPolicy !== null) {
            clientMessage.appendData(expiryPolicy);
        }
        clientMessage.appendInt32(completionId);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

// Empty decodeResponse(ClientMessage), this message has no parameters to decode


}
