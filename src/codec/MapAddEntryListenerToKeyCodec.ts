/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import {Data} from '../serialization/Data';
import {MapMessageType} from './MapMessageType';
import Address = require('../Address');
import DistributedObjectInfoCodec = require('./DistributedObjectInfoCodec');

var REQUEST_TYPE = MapMessageType.MAP_ADDENTRYLISTENERTOKEY;
var RESPONSE_TYPE = 104;
var RETRYABLE = false;


export class MapAddEntryListenerToKeyCodec {


    static calculateSize(name: string, key: Data, includeValue: boolean, listenerFlags: number, localOnly: boolean) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.calculateSizeData(key);
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(name: string, key: Data, includeValue: boolean, listenerFlags: number, localOnly: boolean) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, key, includeValue, listenerFlags, localOnly));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendData(key);
        clientMessage.appendBoolean(includeValue);
        clientMessage.appendInt32(listenerFlags);
        clientMessage.appendBoolean(localOnly);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
// Decode response from client message
        var parameters: any = {'response': null};
        parameters['response'] = clientMessage.readString();
        return parameters;

    }

    static handle(clientMessage: ClientMessage, handleEventEntry: any, toObjectFunction: (data: Data) => any = null) {

        var messageType = clientMessage.getMessageType();
        if (messageType === BitsUtil.EVENT_ENTRY && handleEventEntry !== null) {
            var key: Data;

            if (clientMessage.readBoolean() !== true) {
                key = clientMessage.readData();
            }
            var value: Data;

            if (clientMessage.readBoolean() !== true) {
                value = clientMessage.readData();
            }
            var oldValue: Data;

            if (clientMessage.readBoolean() !== true) {
                oldValue = clientMessage.readData();
            }
            var mergingValue: Data;

            if (clientMessage.readBoolean() !== true) {
                mergingValue = clientMessage.readData();
            }
            var eventType: number;
            eventType = clientMessage.readInt32();
            var uuid: string;
            uuid = clientMessage.readString();
            var numberOfAffectedEntries: number;
            numberOfAffectedEntries = clientMessage.readInt32();
            handleEventEntry(key, value, oldValue, mergingValue, eventType, uuid, numberOfAffectedEntries);
        }
    }

}
