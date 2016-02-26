/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import ImmutableLazyDataList = require('./ImmutableLazyDataList');
import {BitsUtil} from '../BitsUtil';
import Address = require('../Address');
import {Data} from '../serialization/Data';
import {MapMessageType} from './MapMessageType';

var REQUEST_TYPE = MapMessageType.MAP_GETALL;
var RESPONSE_TYPE = 117;
var RETRYABLE = false;


export class MapGetAllCodec {


    static calculateSize(name:string, keys:any) {
        // Calculates the request payload size
        var dataSize:number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        for (var keysItem in keys) {
            dataSize += BitsUtil.calculateSizeData(keysItem);
        }
        return dataSize;
    }

    static encodeRequest(name:string, keys:any) {
        // Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, keys));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendInt32(keys.length);
        for (var keysItem in keys) {
            clientMessage.appendData(keysItem);
        }
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage:ClientMessage, toObjectFunction:(data:Data) => any = null) {
        // Decode response from client message
        var parameters:any = {};
        var responseSize = clientMessage.readInt32();
        var response:any = [];
        for (var responseIndex = 0; responseIndex <= responseSize; responseIndex++) {
            var responseItem = clientMessage.readMapEntry();

            response.push(responseItem)
        }
        parameters['response'] = new ImmutableLazyDataList(response, toObjectFunction);
        return parameters;

    }


}
