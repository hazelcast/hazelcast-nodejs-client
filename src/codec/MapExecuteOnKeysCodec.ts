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
import Address = require('../Address');
import {AddressCodec} from './AddressCodec';
import {UUIDCodec} from './UUIDCodec';
import {MemberCodec} from './MemberCodec';
import {Data} from '../serialization/Data';
import {EntryViewCodec} from './EntryViewCodec';
import DistributedObjectInfoCodec = require('./DistributedObjectInfoCodec');
import {MapMessageType} from './MapMessageType';

var REQUEST_TYPE = MapMessageType.MAP_EXECUTEONKEYS;
var RESPONSE_TYPE = 117;
var RETRYABLE = false;


export class MapExecuteOnKeysCodec {


    static calculateSize(name: string, entryProcessor: Data, keys: any) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.calculateSizeData(entryProcessor);
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;

        keys.forEach((keysItem: any) => {
            dataSize += BitsUtil.calculateSizeData(keysItem);
        });
        return dataSize;
    }

    static encodeRequest(name: string, entryProcessor: Data, keys: any) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, entryProcessor, keys));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendData(entryProcessor);
        clientMessage.appendInt32(keys.length);

        keys.forEach((keysItem: any) => {
            clientMessage.appendData(keysItem);
        });

        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
        // Decode response from client message
        var parameters: any = {
            'response': null
        };


        var responseSize = clientMessage.readInt32();
        var response: any = [];
        for (var responseIndex = 0; responseIndex < responseSize; responseIndex++) {
            var responseItem: any;
            var responseItemKey: Data;
            var responseItemVal: any;
            responseItemKey = clientMessage.readData();
            responseItemVal = clientMessage.readData();
            responseItem = [responseItemKey, responseItemVal];
            response.push(responseItem)
        }
        parameters['response'] = response;

        return parameters;
    }


}
