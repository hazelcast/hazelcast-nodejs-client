/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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

var REQUEST_TYPE = MapMessageType.MAP_VALUESWITHPREDICATE;
var RESPONSE_TYPE = 106;
var RETRYABLE = true;


export class MapValuesWithPredicateCodec {


    static calculateSize(name: string, predicate: Data) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.calculateSizeData(predicate);
        return dataSize;
    }

    static encodeRequest(name: string, predicate: Data) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, predicate));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendData(predicate);
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
            var responseItem: Data;
            responseItem = clientMessage.readData();
            response.push(responseItem);
        }
        parameters['response'] = response;

        return parameters;
    }


}
