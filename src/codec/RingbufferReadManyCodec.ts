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
import {RingbufferMessageType} from './RingbufferMessageType';

var REQUEST_TYPE = RingbufferMessageType.RINGBUFFER_READMANY;
var RESPONSE_TYPE = 115;
var RETRYABLE = true;


export class RingbufferReadManyCodec {


    static calculateSize(name: string, startSequence: any, minCount: number, maxCount: number, filter: Data) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (filter !== null) {
            dataSize += BitsUtil.calculateSizeData(filter);
        }
        return dataSize;
    }

    static encodeRequest(name: string, startSequence: any, minCount: number, maxCount: number, filter: Data) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, startSequence, minCount, maxCount, filter));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendLong(startSequence);
        clientMessage.appendInt32(minCount);
        clientMessage.appendInt32(maxCount);
        clientMessage.appendBoolean(filter === null);
        if (filter !== null) {
            clientMessage.appendData(filter);
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
