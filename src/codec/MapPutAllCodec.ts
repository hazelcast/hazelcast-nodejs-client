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

var REQUEST_TYPE = MapMessageType.MAP_PUTALL;
var RESPONSE_TYPE = 100;
var RETRYABLE = false;


export class MapPutAllCodec {


    static calculateSize(name: string, entries: any) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;

        entries.forEach((entriesItem: any) => {
            var key: Data = entriesItem[0];
            var val: Data = entriesItem[1];
            dataSize += BitsUtil.calculateSizeData(key);
            dataSize += BitsUtil.calculateSizeData(val);
        });
        return dataSize;
    }

    static encodeRequest(name: string, entries: any) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, entries));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendInt32(entries.length);

        entries.forEach((entriesItem: any) => {
            var key: Data = entriesItem[0];
            var val: Data = entriesItem[1];
            clientMessage.appendData(key);
            clientMessage.appendData(val);
        });

        clientMessage.updateFrameLength();
        return clientMessage;
    }

// Empty decodeResponse(ClientMessage), this message has no parameters to decode


}
