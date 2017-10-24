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

var REQUEST_TYPE = MapMessageType.MAP_EVENTJOURNALREAD;
var RESPONSE_TYPE = 115;
var RETRYABLE = true;


export class MapEventJournalReadCodec {


    static calculateSize(name: string, startSequence: any, minSize: number, maxSize: number, predicate: Data, projection: Data) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (predicate !== null) {
            dataSize += BitsUtil.calculateSizeData(predicate);
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (projection !== null) {
            dataSize += BitsUtil.calculateSizeData(projection);
        }
        return dataSize;
    }

    static encodeRequest(name: string, startSequence: any, minSize: number, maxSize: number, predicate: Data, projection: Data) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, startSequence, minSize, maxSize, predicate, projection));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendLong(startSequence);
        clientMessage.appendInt32(minSize);
        clientMessage.appendInt32(maxSize);
        clientMessage.appendBoolean(predicate === null);
        if (predicate !== null) {
            clientMessage.appendData(predicate);
        }
        clientMessage.appendBoolean(projection === null);
        if (projection !== null) {
            clientMessage.appendData(projection);
        }
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
// Decode response from client message
        var parameters: any = {'readCount': null, 'items': null, 'itemSeqs': null};
        parameters['readCount'] = clientMessage.readInt32();

        var itemsSize = clientMessage.readInt32();
        var items: any = [];
        for (var itemsIndex = 0; itemsIndex < itemsSize; itemsIndex++) {
            var itemsItem: Data;
            itemsItem = clientMessage.readData();
            items.push(itemsItem)
        }
        parameters['items'] = items;

        if (clientMessage.readBoolean() !== true) {

            var itemSeqsSize = clientMessage.readInt32();
            var itemSeqs: any = [];
            for (var itemSeqsIndex = 0; itemSeqsIndex < itemSeqsSize; itemSeqsIndex++) {
                var itemSeqsItem: any;
                itemSeqsItem = clientMessage.readLong();
                itemSeqs.push(itemSeqsItem)
            }
            parameters['itemSeqs'] = itemSeqs;
        }
        return parameters;

    }


}
