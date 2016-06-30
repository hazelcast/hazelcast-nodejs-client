/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import {Data} from '../serialization/Data';
import {MultiMapMessageType} from './MultiMapMessageType';
import Address = require('../Address');
import DistributedObjectInfoCodec = require('./DistributedObjectInfoCodec');

var REQUEST_TYPE = MultiMapMessageType.MULTIMAP_ADDENTRYLISTENER;
var RESPONSE_TYPE = 104;
var RETRYABLE = false;


export class MultiMapAddEntryListenerCodec {


    static calculateSize(name: string, includeValue: boolean, localOnly: boolean) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(name: string, includeValue: boolean, localOnly: boolean) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, includeValue, localOnly));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendBoolean(includeValue);
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
            var key: Data = null;

            if (clientMessage.readBoolean() !== true) {
                key = toObjectFunction(clientMessage.readData());
            }
            var value: Data = null;

            if (clientMessage.readBoolean() !== true) {
                value = toObjectFunction(clientMessage.readData());
            }
            var oldValue: Data = null;

            if (clientMessage.readBoolean() !== true) {
                oldValue = toObjectFunction(clientMessage.readData());
            }
            
            var mergingValue: Data = null;

            if (clientMessage.readBoolean() !== true) {
                mergingValue = toObjectFunction(clientMessage.readData());
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
