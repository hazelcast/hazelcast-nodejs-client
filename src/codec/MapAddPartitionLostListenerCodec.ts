/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import ImmutableLazyDataList = require('./ImmutableLazyDataList');
import {BitsUtil} from '../BitsUtil';
import Address = require('../Address');
import {Data} from '../serialization/Data';
import {MapMessageType} from './MapMessageType';

var REQUEST_TYPE = MapMessageType.MAP_ADDPARTITIONLOSTLISTENER;
var RESPONSE_TYPE = 104;
var RETRYABLE = false;


export class MapAddPartitionLostListenerCodec {


    static calculateSize(name:string, localOnly:boolean) {
        // Calculates the request payload size
        var dataSize:number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(name:string, localOnly:boolean) {
        // Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, localOnly));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
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

    static handle(clientMessage:ClientMessage, handleEventMappartitionlost:any, toObjectFunction:(data:Data) => any = null) {

        var messageType = clientMessage.getMessageType();
        if (messageType === BitsUtil.EVENT_MAPPARTITIONLOST && handleEventMappartitionlost !== null) {
            var partitionId:number;
            partitionId = clientMessage.readInt32();
            var uuid:string;
            uuid = clientMessage.readString();
            handleEventMappartitionlost(partitionId, uuid);
        }
    }

}
