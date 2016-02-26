/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import ImmutableLazyDataList = require('./ImmutableLazyDataList');
import {BitsUtil} from '../BitsUtil';
import Address = require('../Address');
import {Data} from '../serialization/Data';
import {MapMessageType} from './MapMessageType';

var REQUEST_TYPE = MapMessageType.MAP_EXECUTEONALLKEYS;
var RESPONSE_TYPE = 117;
var RETRYABLE = false;


export class MapExecuteOnAllKeysCodec {


    static calculateSize(name:string, entryProcessor:Data) {
        // Calculates the request payload size
        var dataSize:number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.calculateSizeData(entryProcessor);
        return dataSize;
    }

    static encodeRequest(name:string, entryProcessor:Data) {
        // Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, entryProcessor));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendData(entryProcessor);
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
