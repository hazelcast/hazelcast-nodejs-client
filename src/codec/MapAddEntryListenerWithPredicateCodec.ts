/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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
import {Data} from '../serialization/Data';
import {MapMessageType} from './MapMessageType';

var REQUEST_TYPE = MapMessageType.MAP_ADDENTRYLISTENERWITHPREDICATE;
var RESPONSE_TYPE = 104;
var RETRYABLE = false;


export class MapAddEntryListenerWithPredicateCodec {


    static calculateSize(name: string, predicate: Data, includeValue: boolean, listenerFlags: number, localOnly: boolean) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.calculateSizeData(predicate);
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(name: string, predicate: Data, includeValue: boolean, listenerFlags: number, localOnly: boolean) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, predicate, includeValue, listenerFlags, localOnly));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendData(predicate);
        clientMessage.appendBoolean(includeValue);
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
