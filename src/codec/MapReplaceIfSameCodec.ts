/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import ImmutableLazyDataList = require('./ImmutableLazyDataList');
import {BitsUtil} from '../BitsUtil';
import Address = require('../Address');
import {Data} from '../serialization/Data';
import {MapMessageType} from './MapMessageType';

var REQUEST_TYPE = MapMessageType.MAP_REPLACEIFSAME;
var RESPONSE_TYPE = 101;
var RETRYABLE = false;


export class MapReplaceIfSameCodec {


    static calculateSize(name:string, key:Data, testValue:Data, value:Data, threadId:number) {
        // Calculates the request payload size
        var dataSize:number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.calculateSizeData(key);
        dataSize += BitsUtil.calculateSizeData(testValue);
        dataSize += BitsUtil.calculateSizeData(value);
        dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(name:string, key:Data, testValue:Data, value:Data, threadId:number) {
        // Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, key, testValue, value, threadId));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendData(key);
        clientMessage.appendData(testValue);
        clientMessage.appendData(value);
        clientMessage.appendLong(threadId);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage:ClientMessage, toObjectFunction:(data:Data) => any = null) {
        // Decode response from client message
        var parameters:any = {};
        parameters['response'] = clientMessage.readBoolean();
        return parameters;

    }


}
