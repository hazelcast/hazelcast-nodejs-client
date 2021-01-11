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

var REQUEST_TYPE = MapMessageType.MAP_FETCHENTRIES;
var RESPONSE_TYPE = 118;
var RETRYABLE = true;


export class MapFetchEntriesCodec {


    static calculateSize(name: string, partitionId: number, tableIndex: number, batch: number) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(name: string, partitionId: number, tableIndex: number, batch: number) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, partitionId, tableIndex, batch));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendInt32(partitionId);
        clientMessage.appendInt32(tableIndex);
        clientMessage.appendInt32(batch);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
        // Decode response from client message
        var parameters: any = {
            'tableIndex': null,
            'entries': null
        };

        if (clientMessage.isComplete()) {
            return parameters;
        }
        parameters['tableIndex'] = clientMessage.readInt32();


        var entriesSize = clientMessage.readInt32();
        var entries: any = [];
        for (var entriesIndex = 0; entriesIndex < entriesSize; entriesIndex++) {
            var entriesItem: any;
            var entriesItemKey: Data;
            var entriesItemVal: any;
            entriesItemKey = clientMessage.readData();
            entriesItemVal = clientMessage.readData();
            entriesItem = [entriesItemKey, entriesItemVal];
            entries.push(entriesItem);
        }
        parameters['entries'] = entries;

        return parameters;
    }


}
