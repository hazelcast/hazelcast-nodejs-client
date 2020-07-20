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

/*tslint:disable:max-line-length*/
import {BitsUtil} from '../BitsUtil';
import {FixSizedTypesCodec} from './builtin/FixSizedTypesCodec';
import {ClientMessage, Frame, RESPONSE_BACKUP_ACKS_OFFSET, PARTITION_ID_OFFSET} from '../ClientMessage';
import {UUID} from '../core/UUID';
import {StringCodec} from './builtin/StringCodec';
import {ByteArrayCodec} from './builtin/ByteArrayCodec';
import {ListMultiFrameCodec} from './builtin/ListMultiFrameCodec';
import {Address} from '../Address';
import {AddressCodec} from './custom/AddressCodec';
import {CodecUtil} from './builtin/CodecUtil';

// hex: 0x000200
const REQUEST_MESSAGE_TYPE = 512;
// hex: 0x000201
// RESPONSE_MESSAGE_TYPE = 513

const REQUEST_UUID_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_SERIALIZATION_VERSION_OFFSET = REQUEST_UUID_OFFSET + BitsUtil.UUID_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_SERIALIZATION_VERSION_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
const RESPONSE_STATUS_OFFSET = RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
const RESPONSE_MEMBER_UUID_OFFSET = RESPONSE_STATUS_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
const RESPONSE_SERIALIZATION_VERSION_OFFSET = RESPONSE_MEMBER_UUID_OFFSET + BitsUtil.UUID_SIZE_IN_BYTES;
const RESPONSE_PARTITION_COUNT_OFFSET = RESPONSE_SERIALIZATION_VERSION_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
const RESPONSE_CLUSTER_ID_OFFSET = RESPONSE_PARTITION_COUNT_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const RESPONSE_FAILOVER_SUPPORTED_OFFSET = RESPONSE_CLUSTER_ID_OFFSET + BitsUtil.UUID_SIZE_IN_BYTES;

export interface ClientAuthenticationCustomResponseParams {
    status: number;
    address: Address;
    memberUuid: UUID;
    serializationVersion: number;
    serverHazelcastVersion: string;
    partitionCount: number;
    clusterId: UUID;
    failoverSupported: boolean;
}

export class ClientAuthenticationCustomCodec {
    static encodeRequest(clusterName: string, credentials: Buffer, uuid: UUID, clientType: string, serializationVersion: number, clientHazelcastVersion: string, clientName: string, labels: string[]): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        FixSizedTypesCodec.encodeUUID(initialFrame.content, REQUEST_UUID_OFFSET, uuid);
        FixSizedTypesCodec.encodeByte(initialFrame.content, REQUEST_SERIALIZATION_VERSION_OFFSET, serializationVersion);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        StringCodec.encode(clientMessage, clusterName);
        ByteArrayCodec.encode(clientMessage, credentials);
        StringCodec.encode(clientMessage, clientType);
        StringCodec.encode(clientMessage, clientHazelcastVersion);
        StringCodec.encode(clientMessage, clientName);
        ListMultiFrameCodec.encode(clientMessage, labels, StringCodec.encode);
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): ClientAuthenticationCustomResponseParams {
        const initialFrame = clientMessage.nextFrame();

        return {
            status: FixSizedTypesCodec.decodeByte(initialFrame.content, RESPONSE_STATUS_OFFSET),
            memberUuid: FixSizedTypesCodec.decodeUUID(initialFrame.content, RESPONSE_MEMBER_UUID_OFFSET),
            serializationVersion: FixSizedTypesCodec.decodeByte(initialFrame.content, RESPONSE_SERIALIZATION_VERSION_OFFSET),
            partitionCount: FixSizedTypesCodec.decodeInt(initialFrame.content, RESPONSE_PARTITION_COUNT_OFFSET),
            clusterId: FixSizedTypesCodec.decodeUUID(initialFrame.content, RESPONSE_CLUSTER_ID_OFFSET),
            failoverSupported: FixSizedTypesCodec.decodeBoolean(initialFrame.content, RESPONSE_FAILOVER_SUPPORTED_OFFSET),
            address: CodecUtil.decodeNullable(clientMessage, AddressCodec.decode),
            serverHazelcastVersion: StringCodec.decode(clientMessage),
        };
    }
}
