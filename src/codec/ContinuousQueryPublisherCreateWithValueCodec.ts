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
import {ContinuousQueryMessageType} from './ContinuousQueryMessageType';

var REQUEST_TYPE = ContinuousQueryMessageType.CONTINUOUSQUERY_PUBLISHERCREATEWITHVALUE;
var RESPONSE_TYPE = 117;
var RETRYABLE = true;


export class ContinuousQueryPublisherCreateWithValueCodec {


    static calculateSize(mapName: string, cacheName: string, predicate: Data, batchSize: number, bufferSize: number, delaySeconds: any, populate: boolean, coalesce: boolean) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(mapName);
        dataSize += BitsUtil.calculateSizeString(cacheName);
        dataSize += BitsUtil.calculateSizeData(predicate);
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(mapName: string, cacheName: string, predicate: Data, batchSize: number, bufferSize: number, delaySeconds: any, populate: boolean, coalesce: boolean) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(mapName, cacheName, predicate, batchSize, bufferSize, delaySeconds, populate, coalesce));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(mapName);
        clientMessage.appendString(cacheName);
        clientMessage.appendData(predicate);
        clientMessage.appendInt32(batchSize);
        clientMessage.appendInt32(bufferSize);
        clientMessage.appendLong(delaySeconds);
        clientMessage.appendBoolean(populate);
        clientMessage.appendBoolean(coalesce);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
        // Decode response from client message
        var parameters: any = {
            'response': null
        };


        var responseSize = clientMessage.readInt32();
        var response: any = [];
        for (var responseIndex = 0; responseIndex < responseSize; responseIndex++) {
            var responseItem: any;
            var responseItemKey: Data;
            var responseItemVal: any;
            responseItemKey = clientMessage.readData();
            responseItemVal = clientMessage.readData();
            responseItem = [responseItemKey, responseItemVal];
            response.push(responseItem)
        }
        parameters['response'] = response;

        return parameters;
    }


}
