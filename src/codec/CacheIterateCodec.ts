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

var REQUEST_TYPE = CacheMessageType.CACHE_ITERATE;
var RESPONSE_TYPE = 116;
var RETRYABLE = false;


export class CacheIterateCodec {


    static calculateSize(name: string, partitionId: number, tableIndex: number, batch: number) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(name: string, partitionId: number, tableIndex: number, batch: number) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, partitionId, tableIndex, batch));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendInt32(partitionId);
        clientMessage.appendInt32(tableIndex);
        clientMessage.appendInt32(batch);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
        // Decode response from client message
        var parameters: any = {
            'tableIndex': null,
            'keys': null
        };

        parameters['tableIndex'] = clientMessage.readInt32();


        var keysSize = clientMessage.readInt32();
        var keys: any = [];
        for (var keysIndex = 0; keysIndex < keysSize; keysIndex++) {
            var keysItem: Data;
            keysItem = clientMessage.readData();
            keys.push(keysItem)
        }
        parameters['keys'] = keys;

        return parameters;
    }


}
