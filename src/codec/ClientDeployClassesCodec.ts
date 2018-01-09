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
import {ClientMessageType} from './ClientMessageType';

var REQUEST_TYPE = ClientMessageType.CLIENT_DEPLOYCLASSES;
var RESPONSE_TYPE = 100;
var RETRYABLE = false;


export class ClientDeployClassesCodec {


    static calculateSize(classDefinitions: any) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;

        classDefinitions.forEach((classDefinitionsItem: any) => {
            var key: string = classDefinitionsItem[0];
            var val: any = classDefinitionsItem[1];
            dataSize += BitsUtil.calculateSizeString(key);
            data_size += BitsUtil.INT_SIZE_IN_BYTES
            val.forEach((valItem: any) => {
                dataSize += BitsUtil.BYTE_SIZE_IN_BYTES;
            });
        });
        return dataSize;
    }

    static encodeRequest(classDefinitions: any) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(classDefinitions));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendInt32(classDefinitions.length);

        classDefinitions.forEach((classDefinitionsItem: any) => {
            var key: string = classDefinitionsItem[0];
            var val: any = classDefinitionsItem[1];
            clientMessage.appendString(key);
            clientMessage.appendInt32(val.length);

            val.forEach((valItem: any) => {
                clientMessage.appendByte(valItem);
            });

        });

        clientMessage.updateFrameLength();
        return clientMessage;
    }

// Empty decodeResponse(ClientMessage), this message has no parameters to decode


}
