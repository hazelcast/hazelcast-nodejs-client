/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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
import {FlakeIdGeneratorMessageType} from './FlakeIdGeneratorMessageType';

var REQUEST_TYPE = FlakeIdGeneratorMessageType.FLAKEIDGENERATOR_NEWIDBATCH;
var RESPONSE_TYPE = 126;
var RETRYABLE = true;


export class FlakeIdGeneratorNewIdBatchCodec {
    static calculateSize(name: string, batchSize: number) {
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(name: string, batchSize: number) {
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, batchSize));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendInt32(batchSize);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
        var parameters: any = {
            'base': null,
            'increment': null,
            'batchSize': null
        };

        if (clientMessage.isComplete()) {
            return parameters;
        }
        parameters['base'] = clientMessage.readLong();

        parameters['increment'] = clientMessage.readLong();

        parameters['batchSize'] = clientMessage.readInt32();

        return parameters;
    }

}
