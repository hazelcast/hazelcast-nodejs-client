/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import ImmutableLazyDataList = require('./ImmutableLazyDataList');
import {BitsUtil} from '../BitsUtil';
import Address = require('../Address');
import {AddressCodec} from './AddressCodec';
import {MemberCodec} from './MemberCodec';
import {Data} from '../serialization/Data';
import {EntryViewCodec} from './EntryViewCodec';
import {MapMessageType} from './MapMessageType';

var REQUEST_TYPE = MapMessageType.MAP_VALUES;
var RESPONSE_TYPE = 106;
var RETRYABLE = false;


export class MapValuesCodec {


    static calculateSize(name:string) {
        // Calculates the request payload size
        var dataSize:number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        return dataSize;
    }

    static encodeRequest(name:string) {
        // Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage:ClientMessage, toObjectFunction:(data:Data) => any = null) {
        // Decode response from client message
        var parameters:any = {'response': null};
        var responseSize = clientMessage.readInt32();
        var response:any = [];
        for (var responseIndex = 0; responseIndex <= responseSize; responseIndex++) {
            var responseItem:Data;
            responseItem = toObjectFunction(clientMessage.readData());
            response.push(responseItem)
        }
        parameters['response'] = new ImmutableLazyDataList(response, toObjectFunction);
        return parameters;

    }


}
