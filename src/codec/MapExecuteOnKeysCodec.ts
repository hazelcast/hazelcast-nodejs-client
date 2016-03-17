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

var REQUEST_TYPE = MapMessageType.MAP_EXECUTEONKEYS;
var RESPONSE_TYPE = 117;
var RETRYABLE = false;


export class MapExecuteOnKeysCodec {


    static calculateSize(name:string, entryProcessor:Data, keys:any) {
        // Calculates the request payload size
        var dataSize:number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.calculateSizeData(entryProcessor);
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;

        keys.foreach((keysItem:any) => {
            dataSize += BitsUtil.calculateSizeData(keysItem);
        });
        return dataSize;
    }

    static encodeRequest(name:string, entryProcessor:Data, keys:any) {
        // Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, entryProcessor, keys));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendData(entryProcessor);
        clientMessage.appendInt32(keys.length);

        keys.foreach((keysItem:any) => {
            clientMessage.appendData(keysItem);
        });

        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage:ClientMessage, toObjectFunction:(data:Data) => any = null) {
        // Decode response from client message
        var parameters:any = {'response': null};
        var responseSize = clientMessage.readInt32();
        var response:any = [];
        for (var responseIndex = 0; responseIndex <= responseSize; responseIndex++) {
            var responseItem:any;
            responseItem = clientMessage.readMapEntry();
            response.push(responseItem)
        }
        parameters['response'] = new ImmutableLazyDataList(response, toObjectFunction);
        return parameters;

    }


}
