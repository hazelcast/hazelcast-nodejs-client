/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import ImmutableLazyDataList = require('./ImmutableLazyDataList');
import {BitsUtil} from '../BitsUtil';
import Address = require('../Address');
import {Data} from '../serialization/Data';
import {MapMessageType} from './MapMessageType';

var REQUEST_TYPE = MapMessageType.MAP_REMOVEINTERCEPTOR;
var RESPONSE_TYPE = 101;
var RETRYABLE = false;


export class MapRemoveInterceptorCodec {


    static calculateSize(name:string, id:string) {
        // Calculates the request payload size
        var dataSize:number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.calculateSizeString(id);
        return dataSize;
    }

    static encodeRequest(name:string, id:string) {
        // Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, id));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendString(id);
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
