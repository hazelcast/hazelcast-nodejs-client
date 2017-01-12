/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import {Data} from '../serialization/Data';
import {ReplicatedMapMessageType} from './ReplicatedMapMessageType';

var REQUEST_TYPE = ReplicatedMapMessageType.REPLICATEDMAP_ADDENTRYLISTENERTOKEYWITHPREDICATE;
var RESPONSE_TYPE = 104;
var RETRYABLE = false;


export class ReplicatedMapAddEntryListenerToKeyWithPredicateCodec {


    static calculateSize(name: string, key: Data, predicate: Data, localOnly: boolean) {
// Calculates the request payload size
        let dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.calculateSizeData(key);
        dataSize += BitsUtil.calculateSizeData(predicate);
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(name: string, key: Data, predicate: Data, localOnly: boolean) {
// Encode request into clientMessage
        const clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, key, predicate, localOnly));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendData(key);
        clientMessage.appendData(predicate);
        clientMessage.appendBoolean(localOnly);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
// Decode response from client message
        const parameters: any = {'response': null};
        parameters['response'] = clientMessage.readString();
        return parameters;
    }

    static handle(clientMessage: ClientMessage, handleEventEntry: any, toObjectFunction: (data: Data) => any = null) {
        const messageType = clientMessage.getMessageType();
        if (messageType === BitsUtil.EVENT_ENTRY && handleEventEntry !== null) {
            let key: Data;

            if (clientMessage.readBoolean() !== true) {
                key = clientMessage.readData();
            }
            let value: Data;

            if (clientMessage.readBoolean() !== true) {
                value = clientMessage.readData();
            }
            let oldValue: Data;

            if (clientMessage.readBoolean() !== true) {
                oldValue = clientMessage.readData();
            }
            let mergingValue: Data;

            if (clientMessage.readBoolean() !== true) {
                mergingValue = clientMessage.readData();
            }
            const eventType: number = clientMessage.readInt32();
            const uuid: string = clientMessage.readString();
            const numberOfAffectedEntries: number = clientMessage.readInt32();
            handleEventEntry(key, value, oldValue, mergingValue, eventType, uuid, numberOfAffectedEntries);
        }
    }
}
