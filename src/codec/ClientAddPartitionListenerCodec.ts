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
import Address = require('../Address');
import {BitsUtil} from '../BitsUtil';
import {AddressCodec} from './AddressCodec';
import {Data} from '../serialization/Data';
import {ClientMessageType} from './ClientMessageType';

var REQUEST_TYPE = ClientMessageType.CLIENT_ADDPARTITIONLISTENER;
var RESPONSE_TYPE = 100;
var RETRYABLE = false;


export class ClientAddPartitionListenerCodec {


    static calculateSize() {
// Calculates the request payload size
        var dataSize: number = 0;
        return dataSize;
    }

    static encodeRequest() {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize());
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

// Empty decodeResponse(ClientMessage), this message has no parameters to decode

    static handle(clientMessage: ClientMessage, handleEventPartitions: any, toObjectFunction: (data: Data) => any = null) {

        var messageType = clientMessage.getMessageType();
        if (messageType === BitsUtil.EVENT_PARTITIONS && handleEventPartitions !== null) {
            var messageFinished = false;
            var partitions: any = undefined;
            if (!messageFinished) {
                messageFinished = clientMessage.isComplete();
            }
            if (!messageFinished) {

                var partitionsSize = clientMessage.readInt32();
                partitions = [];
                for (var partitionsIndex = 0; partitionsIndex < partitionsSize; partitionsIndex++) {
                    var partitionsItem: any;
                    var partitionsItemKey: Address;
                    var partitionsItemVal: any;
                    partitionsItemKey = AddressCodec.decode(clientMessage, toObjectFunction);

                    var partitionsItemValSize = clientMessage.readInt32();
                    var partitionsItemVal: any = [];
                    for (var partitionsItemValIndex = 0; partitionsItemValIndex < partitionsItemValSize; partitionsItemValIndex++) {
                        var partitionsItemValItem: number;
                        partitionsItemValItem = clientMessage.readInt32();
                        partitionsItemVal.push(partitionsItemValItem);
                    }
                    partitionsItem = [partitionsItemKey, partitionsItemVal];
                    partitions.push(partitionsItem);
                }
            }
            var partitionStateVersion: number = undefined;
            if (!messageFinished) {
                partitionStateVersion = clientMessage.readInt32();
            }
            handleEventPartitions(partitions, partitionStateVersion);
        }
    }

}
