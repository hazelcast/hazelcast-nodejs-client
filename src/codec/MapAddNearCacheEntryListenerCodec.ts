/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import ImmutableLazyDataList = require('./ImmutableLazyDataList');
import {BitsUtil} from '../BitsUtil';
import Address = require('../Address');
import {Data} from '../serialization/Data';
import {MapMessageType} from './MapMessageType';

var REQUEST_TYPE = MapMessageType.MAP_ADDNEARCACHEENTRYLISTENER;
var RESPONSE_TYPE = 104;
var RETRYABLE = false;


export class MapAddNearCacheEntryListenerCodec {


    static calculateSize(name:string, listenerFlags:number, localOnly:boolean) {
        // Calculates the request payload size
        var dataSize:number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(name:string, listenerFlags:number, localOnly:boolean) {
        // Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, listenerFlags, localOnly));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendInt32(listenerFlags);
        clientMessage.appendBoolean(localOnly);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage:ClientMessage, toObjectFunction:(data:Data) => any = null) {
        // Decode response from client message
        var parameters:any = {};
        parameters['response'] = clientMessage.readString();
        return parameters;

    }

    static handle(clientMessage:ClientMessage, handleEventImapinvalidation:any, handleEventImapbatchinvalidation:any, toObjectFunction:(data:Data) => any = null) {

        var messageType = clientMessage.getMessageType();
        if (messageType === BitsUtil.EVENT_IMAPINVALIDATION && handleEventImapinvalidation !== null) {
            var key:Data;

            if (clientMessage.readBoolean() !== true) {
                key = toObjectFunction(clientMessage.readData());
            }
            handleEventImapinvalidation(key);
        }
        if (messageType === BitsUtil.EVENT_IMAPBATCHINVALIDATION && handleEventImapbatchinvalidation !== null) {
            var keys:any;
            var keysSize = clientMessage.readInt32();
            keys = [];
            for (var keysIndex = 0; keysIndex <= keysSize; keysIndex++) {
                var keysItem = toObjectFunction(clientMessage.readData());

                keys.push(keysItem)
            }
            handleEventImapbatchinvalidation(keys);
        }
    }

}
