/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import {Data} from '../serialization/Data';
import {RingbufferMessageType} from './RingbufferMessageType';
import Address = require('../Address');
import DistributedObjectInfoCodec = require('./DistributedObjectInfoCodec');

var REQUEST_TYPE = RingbufferMessageType.RINGBUFFER_READMANY;
var RESPONSE_TYPE = 115;
var RETRYABLE = false;


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
        var parameters: any = {'readCount': null, 'items': null};
        parameters['readCount'] = clientMessage.readInt32();
        var itemsSize = clientMessage.readInt32();
        var items: any = [];
        for (var itemsIndex = 0; itemsIndex < itemsSize; itemsIndex++) {
            var itemsItem: Data;
            itemsItem = clientMessage.readData();
            items.push(itemsItem)
        }
        parameters['items'] = items;
        return parameters;
    }


}
