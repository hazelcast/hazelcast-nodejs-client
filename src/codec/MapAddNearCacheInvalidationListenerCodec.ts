/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import {UUIDCodec} from './UUIDCodec';
import {Data} from '../serialization/Data';
import {MapMessageType} from './MapMessageType';

var REQUEST_TYPE = MapMessageType.MAP_ADDNEARCACHEINVALIDATIONLISTENER;
var RESPONSE_TYPE = 104;
var RETRYABLE = false;


export class MapAddNearCacheInvalidationListenerCodec {


    static calculateSize(name: string, listenerFlags: number, localOnly: boolean) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(name: string, listenerFlags: number, localOnly: boolean) {
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

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
        // Decode response from client message
        var parameters: any = {
            'response': null
        };

        if (clientMessage.isComplete()) {
            return parameters;
        }
        parameters['response'] = clientMessage.readString();

        return parameters;
    }

    static handle(clientMessage: ClientMessage, handleEventImapinvalidation: any, handleEventImapbatchinvalidation: any, toObjectFunction: (data: Data) => any = null) {

        var messageType = clientMessage.getMessageType();
        if (messageType === BitsUtil.EVENT_IMAPINVALIDATION && handleEventImapinvalidation !== null) {
            var messageFinished = false;
            var key: Data = undefined;
            if (!messageFinished) {
                messageFinished = clientMessage.isComplete();
            }
            if (!messageFinished) {

                if (clientMessage.readBoolean() !== true) {
                    key = clientMessage.readData();
                }
            }
            var sourceUuid: string = undefined;
            if (!messageFinished) {
                sourceUuid = clientMessage.readString();
            }
            var partitionUuid: any = undefined;
            if (!messageFinished) {
                partitionUuid = UUIDCodec.decode(clientMessage, toObjectFunction);
            }
            var sequence: any = undefined;
            if (!messageFinished) {
                sequence = clientMessage.readLong();
            }
            handleEventImapinvalidation(key, sourceUuid, partitionUuid, sequence);
        }
        if (messageType === BitsUtil.EVENT_IMAPBATCHINVALIDATION && handleEventImapbatchinvalidation !== null) {
            var messageFinished = false;
            var keys: any = undefined;
            if (!messageFinished) {
                messageFinished = clientMessage.isComplete();
            }
            if (!messageFinished) {

                var keysSize = clientMessage.readInt32();
                keys = [];
                for (var keysIndex = 0; keysIndex < keysSize; keysIndex++) {
                    var keysItem: Data;
                    keysItem = clientMessage.readData();
                    keys.push(keysItem);
                }
            }
            var sourceUuids: any = undefined;
            if (!messageFinished) {

                var sourceUuidsSize = clientMessage.readInt32();
                sourceUuids = [];
                for (var sourceUuidsIndex = 0; sourceUuidsIndex < sourceUuidsSize; sourceUuidsIndex++) {
                    var sourceUuidsItem: string;
                    sourceUuidsItem = clientMessage.readString();
                    sourceUuids.push(sourceUuidsItem);
                }
            }
            var partitionUuids: any = undefined;
            if (!messageFinished) {

                var partitionUuidsSize = clientMessage.readInt32();
                partitionUuids = [];
                for (var partitionUuidsIndex = 0; partitionUuidsIndex < partitionUuidsSize; partitionUuidsIndex++) {
                    var partitionUuidsItem: any;
                    partitionUuidsItem = UUIDCodec.decode(clientMessage, toObjectFunction);
                    partitionUuids.push(partitionUuidsItem);
                }
            }
            var sequences: any = undefined;
            if (!messageFinished) {

                var sequencesSize = clientMessage.readInt32();
                sequences = [];
                for (var sequencesIndex = 0; sequencesIndex < sequencesSize; sequencesIndex++) {
                    var sequencesItem: any;
                    sequencesItem = clientMessage.readLong();
                    sequences.push(sequencesItem);
                }
            }
            handleEventImapbatchinvalidation(keys, sourceUuids, partitionUuids, sequences);
        }
    }

}
