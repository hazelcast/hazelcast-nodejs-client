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
import {CacheMessageType} from './CacheMessageType';

var REQUEST_TYPE = CacheMessageType.CACHE_ADDINVALIDATIONLISTENER;
var RESPONSE_TYPE = 104;
var RETRYABLE = false;


export class CacheAddInvalidationListenerCodec {


    static calculateSize(name: string, localOnly: boolean) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(name: string, localOnly: boolean) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, localOnly));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
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

    static handle(clientMessage: ClientMessage, handleEventCacheinvalidation: any, handleEventCachebatchinvalidation: any, toObjectFunction: (data: Data) => any = null) {

        var messageType = clientMessage.getMessageType();
        if (messageType === BitsUtil.EVENT_CACHEINVALIDATION && handleEventCacheinvalidation !== null) {
            var messageFinished = false;
            var name: string = undefined;
            if (!messageFinished) {
                name = clientMessage.readString();
            }
            var key: Data = undefined;
            if (!messageFinished) {

                if (clientMessage.readBoolean() !== true) {
                    key = clientMessage.readData();
                }
            }
            var sourceUuid: string = undefined;
            if (!messageFinished) {

                if (clientMessage.readBoolean() !== true) {
                    sourceUuid = clientMessage.readString();
                }
            }
            var partitionUuid: any = undefined;
            if (!messageFinished) {
                messageFinished = clientMessage.isComplete();
            }
            if (!messageFinished) {
                partitionUuid = UUIDCodec.decode(clientMessage, toObjectFunction);
            }
            var sequence: any = undefined;
            if (!messageFinished) {
                sequence = clientMessage.readLong();
            }
            handleEventCacheinvalidation(name, key, sourceUuid, partitionUuid, sequence);
        }
        if (messageType === BitsUtil.EVENT_CACHEBATCHINVALIDATION && handleEventCachebatchinvalidation !== null) {
            var messageFinished = false;
            var name: string = undefined;
            if (!messageFinished) {
                name = clientMessage.readString();
            }
            var keys: any = undefined;
            if (!messageFinished) {

                var keysSize = clientMessage.readInt32();
                keys = [];
                for (var keysIndex = 0; keysIndex < keysSize; keysIndex++) {
                    var keysItem: Data;
                    keysItem = clientMessage.readData();
                    keys.push(keysItem)
                }
            }
            var sourceUuids: any = undefined;
            if (!messageFinished) {

                if (clientMessage.readBoolean() !== true) {

                    var sourceUuidsSize = clientMessage.readInt32();
                    sourceUuids = [];
                    for (var sourceUuidsIndex = 0; sourceUuidsIndex < sourceUuidsSize; sourceUuidsIndex++) {
                        var sourceUuidsItem: string;
                        sourceUuidsItem = clientMessage.readString();
                        sourceUuids.push(sourceUuidsItem)
                    }
                }
            }
            var partitionUuids: any = undefined;
            if (!messageFinished) {
                messageFinished = clientMessage.isComplete();
            }
            if (!messageFinished) {

                var partitionUuidsSize = clientMessage.readInt32();
                partitionUuids = [];
                for (var partitionUuidsIndex = 0; partitionUuidsIndex < partitionUuidsSize; partitionUuidsIndex++) {
                    var partitionUuidsItem: any;
                    partitionUuidsItem = UUIDCodec.decode(clientMessage, toObjectFunction);
                    partitionUuids.push(partitionUuidsItem)
                }
            }
            var sequences: any = undefined;
            if (!messageFinished) {

                var sequencesSize = clientMessage.readInt32();
                sequences = [];
                for (var sequencesIndex = 0; sequencesIndex < sequencesSize; sequencesIndex++) {
                    var sequencesItem: any;
                    sequencesItem = clientMessage.readLong();
                    sequences.push(sequencesItem)
                }
            }
            handleEventCachebatchinvalidation(name, keys, sourceUuids, partitionUuids, sequences);
        }
    }

}
