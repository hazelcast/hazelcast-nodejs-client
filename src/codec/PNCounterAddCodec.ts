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
import {PNCounterMessageType} from './PNCounterMessageType';

var REQUEST_TYPE = PNCounterMessageType.PNCOUNTER_ADD;
var RESPONSE_TYPE = 127;
var RETRYABLE = false;


export class PNCounterAddCodec {
    static calculateSize(name: string, delta: any, getBeforeUpdate: boolean, replicaTimestamps: Array<[string, any]>, targetReplica: Address) {
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;

        replicaTimestamps.forEach((replicaTimestampsItem: [string, any]) => {
            var key: string = replicaTimestampsItem[0];
            var val: any = replicaTimestampsItem[1];
            dataSize += BitsUtil.calculateSizeString(key);
            dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
        });
        dataSize += BitsUtil.calculateSizeAddress(targetReplica);
        return dataSize;
    }

    static encodeRequest(name: string, delta: any, getBeforeUpdate: boolean, replicaTimestamps: Array<[string, any]>, targetReplica: Address) {
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, delta, getBeforeUpdate, replicaTimestamps, targetReplica));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendLong(delta);
        clientMessage.appendBoolean(getBeforeUpdate);
        clientMessage.appendInt32(replicaTimestamps.length);

        replicaTimestamps.forEach((replicaTimestampsItem: any) => {
            var key: string = replicaTimestampsItem[0];
            var val: any = replicaTimestampsItem[1];
            clientMessage.appendString(key);
            clientMessage.appendLong(val);
        });

        AddressCodec.encode(clientMessage, targetReplica);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
        var parameters: any = {
            'value': null,
            'replicaTimestamps': null,
            'replicaCount': null
        };

        if (clientMessage.isComplete()) {
            return parameters;
        }
        parameters['value'] = clientMessage.readLong();


        var replicaTimestampsSize = clientMessage.readInt32();
        var replicaTimestamps: Array<[string, any]> = [];
        for (var replicaTimestampsIndex = 0; replicaTimestampsIndex < replicaTimestampsSize; replicaTimestampsIndex++) {
            var replicaTimestampsItem: [string, any];
            var replicaTimestampsItemKey: string;
            var replicaTimestampsItemVal: any;
            replicaTimestampsItemKey = clientMessage.readString();
            replicaTimestampsItemVal = clientMessage.readLong();
            replicaTimestampsItem = [replicaTimestampsItemKey, replicaTimestampsItemVal];
            replicaTimestamps.push(replicaTimestampsItem);
        }
        parameters['replicaTimestamps'] = replicaTimestamps;

        parameters['replicaCount'] = clientMessage.readInt32();

        return parameters;
    }

}
