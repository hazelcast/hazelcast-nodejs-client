/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import Address = require('../Address');
import {AddressCodec} from './AddressCodec';
import {UUIDCodec} from './UUIDCodec';
import {MemberCodec} from './MemberCodec';
import {Data} from '../serialization/Data';
import {EntryViewCodec} from './EntryViewCodec';
import DistributedObjectInfoCodec = require('./DistributedObjectInfoCodec');
import {ReplicatedMapMessageType} from './ReplicatedMapMessageType';

var REQUEST_TYPE = ReplicatedMapMessageType.REPLICATEDMAP_ADDENTRYLISTENERTOKEYWITHPREDICATE;
var RESPONSE_TYPE = 104;
var RETRYABLE = false;


export class ReplicatedMapAddEntryListenerToKeyWithPredicateCodec {


    static calculateSize(name: string, key: Data, predicate: Data, localOnly: boolean) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.calculateSizeData(key);
        dataSize += BitsUtil.calculateSizeData(predicate);
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(name: string, key: Data, predicate: Data, localOnly: boolean) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, key, predicate, localOnly));
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
        var parameters: any = {
            'response': null
        };

        parameters['response'] = clientMessage.readString();

        return parameters;
    }

    static handle(clientMessage: ClientMessage, handleEventEntry: any, toObjectFunction: (data: Data) => any = null) {

        var messageType = clientMessage.getMessageType();
        if (messageType === BitsUtil.EVENT_ENTRY && handleEventEntry !== null) {
            var messageFinished = false;
            var key: Data = undefined;
            if (!messageFinished) {

                if (clientMessage.readBoolean() !== true) {
                    key = clientMessage.readData();
                }
            }
            var value: Data = undefined;
            if (!messageFinished) {

                if (clientMessage.readBoolean() !== true) {
                    value = clientMessage.readData();
                }
            }
            var oldValue: Data = undefined;
            if (!messageFinished) {

                if (clientMessage.readBoolean() !== true) {
                    oldValue = clientMessage.readData();
                }
            }
            var mergingValue: Data = undefined;
            if (!messageFinished) {

                if (clientMessage.readBoolean() !== true) {
                    mergingValue = clientMessage.readData();
                }
            }
            var eventType: number = undefined;
            if (!messageFinished) {
                eventType = clientMessage.readInt32();
            }
            var uuid: string = undefined;
            if (!messageFinished) {
                uuid = clientMessage.readString();
            }
            var numberOfAffectedEntries: number = undefined;
            if (!messageFinished) {
                numberOfAffectedEntries = clientMessage.readInt32();
            }
            handleEventEntry(key, value, oldValue, mergingValue, eventType, uuid, numberOfAffectedEntries);
        }
    }

}
