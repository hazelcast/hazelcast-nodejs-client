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

var REQUEST_TYPE = MapMessageType.MAP_FETCHWITHQUERY;
var RESPONSE_TYPE = 124;
var RETRYABLE = true;


export class MapFetchWithQueryCodec {


    static calculateSize(name: string, tableIndex: number, batch: number, projection: Data, predicate: Data) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.calculateSizeData(projection);
        dataSize += BitsUtil.calculateSizeData(predicate);
        return dataSize;
    }

    static encodeRequest(name: string, tableIndex: number, batch: number, projection: Data, predicate: Data) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, tableIndex, batch, projection, predicate));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendInt32(tableIndex);
        clientMessage.appendInt32(batch);
        clientMessage.appendData(projection);
        clientMessage.appendData(predicate);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
        // Decode response from client message
        var parameters: any = {
            'results': null,
            'nextTableIndexToReadFrom': null
        };

        if (clientMessage.isComplete()) {
            return parameters;
        }

        var resultsSize = clientMessage.readInt32();
        var results: any = [];
        for (var resultsIndex = 0; resultsIndex < resultsSize; resultsIndex++) {
            var resultsItem: Data;
            resultsItem = clientMessage.readData();
            results.push(resultsItem)
        }
        parameters['results'] = results;

        parameters['nextTableIndexToReadFrom'] = clientMessage.readInt32();

        return parameters;
    }


}
