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

import * as Long from 'long';
import {Address} from '../Address';
import {AddressCodec} from '../builtin/AddressCodec';
import {MemberCodec} from '../builtin/MemberCodec';
import {Data} from '../serialization/Data';
import {SimpleEntryViewCodec} from '../builtin/SimpleEntryViewCodec';
import {DistributedObjectInfoCodec} from '../builtin/DistributedObjectInfoCodec';
import {DistributedObjectInfo} from '../builtin/DistributedObjectInfo';
import {Member} from '../core/Member';
import {UUID} from '../core/UUID';
import {FixedSizeTypes} from '../builtin/FixedSizeTypes';
import {BitsUtil} from '../BitsUtil';
import {ClientConnection} from '../invocation/ClientConnection';
import {ClientMessage, Frame} from '../ClientMessage';
import {Buffer} from 'safe-buffer';
import {ClientProtocolErrorCodes} from '../protocol/ClientProtocolErrorCodes';
import {CodecUtil} from '../builtin/CodecUtil';
import {DataCodec} from '../builtin/DataCodec';
import {ErrorCodec} from '../protocol/ErrorCodec';
import {ErrorsCodec} from '../protocol/ErrorsCodec';
import {ListIntegerCodec} from '../builtin/ListIntegerCodec';
import {ListUUIDCodec} from '../builtin/ListUUIDCodec';
import {ListLongCodec} from '../builtin/ListLongCodec';
import {ListMultiFrameCodec} from '../builtin/ListMultiFrameCodec';
import {LongArrayCodec} from '../builtin/LongArrayCodec';
import {MapCodec} from '../builtin/MapCodec';
import {MapIntegerLongCodec} from '../builtin/MapIntegerLongCodec';
import {MapIntegerUUIDCodec} from '../builtin/MapIntegerUUIDCodec';
import {MapStringLongCodec} from '../builtin/MapStringLongCodec';
import {MapUUIDLongCodec} from '../builtin/MapUUIDLongCodec';
import {StackTraceElementCodec} from '../protocol/StackTraceElementCodec';
import {StringCodec} from '../builtin/StringCodec';

/* tslint:disabled:URF-UNREAD-PUBLIC-OR-PROTECTED-FIELD */
export class RequestParameters {

    /**
     * name of scheduled executor
     */
    public name: string;

    /**
     * number of executor threads per member for the executor
     */
    public poolSize: number;

    /**
     * durability of the scheduled executor
     */
    public durability: number;

    /**
     * maximum number of tasks that a scheduler can have at any given point in time per partition
     */
    public capacity: number;

    /**
     * name of an existing configured split brain protection to be used to determine the minimum number of members
     * required in the cluster for the lock to remain functional. When {@code null}, split brain protection does not
     * apply to this lock configuration's operations.
     */
    public splitBrainProtectionName: string;

    /**
     * TODO DOC
     */
    public mergePolicy: string;

    /**
     * TODO DOC
     */
    public mergeBatchSize: number;
}

/* tslint:disable:URF-UNREAD-PUBLIC-OR-PROTECTED-FIELD */
export class ResponseParameters {
}

/**
 * Adds a new scheduled executor configuration to a running cluster.
 * If a scheduled executor configuration with the given {@code name} already exists, then
 * the new configuration is ignored and the existing one is preserved.
 */
/* tslint:disable:max-line-length no-bitwise */
export class DynamicConfigAddScheduledExecutorConfigCodec {
    // hex: 0x1E0B00
    public static REQUEST_MESSAGE_TYPE = 1968896;
    // hex: 0x1E0B01
    public static RESPONSE_MESSAGE_TYPE = 1968897;
    private static REQUEST_POOL_SIZE_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_DURABILITY_FIELD_OFFSET = DynamicConfigAddScheduledExecutorConfigCodec.REQUEST_POOL_SIZE_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_CAPACITY_FIELD_OFFSET = DynamicConfigAddScheduledExecutorConfigCodec.REQUEST_DURABILITY_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_MERGE_BATCH_SIZE_FIELD_OFFSET = DynamicConfigAddScheduledExecutorConfigCodec.REQUEST_CAPACITY_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = DynamicConfigAddScheduledExecutorConfigCodec.REQUEST_MERGE_BATCH_SIZE_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;

    static encodeRequest(name: string, poolSize: number, durability: number, capacity: number, splitBrainProtectionName: string, mergePolicy: string, mergeBatchSize: number): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName('DynamicConfig.AddScheduledExecutorConfig');
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(DynamicConfigAddScheduledExecutorConfigCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, DynamicConfigAddScheduledExecutorConfigCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeInt(initialFrame.content, DynamicConfigAddScheduledExecutorConfigCodec.REQUEST_POOL_SIZE_FIELD_OFFSET, poolSize);
        FixedSizeTypes.encodeInt(initialFrame.content, DynamicConfigAddScheduledExecutorConfigCodec.REQUEST_DURABILITY_FIELD_OFFSET, durability);
        FixedSizeTypes.encodeInt(initialFrame.content, DynamicConfigAddScheduledExecutorConfigCodec.REQUEST_CAPACITY_FIELD_OFFSET, capacity);
        FixedSizeTypes.encodeInt(initialFrame.content, DynamicConfigAddScheduledExecutorConfigCodec.REQUEST_MERGE_BATCH_SIZE_FIELD_OFFSET, mergeBatchSize);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, name);
        CodecUtil.encodeNullable(clientMessage,  splitBrainProtectionName, StringCodec.encode );
        StringCodec.encode(clientMessage, mergePolicy);
        return clientMessage;
    }

    static decodeRequest(clientMessage: ClientMessage): RequestParameters {
        const request: RequestParameters = new RequestParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        request.poolSize =  FixedSizeTypes.decodeInt(initialFrame.content, DynamicConfigAddScheduledExecutorConfigCodec.REQUEST_POOL_SIZE_FIELD_OFFSET);
        request.durability =  FixedSizeTypes.decodeInt(initialFrame.content, DynamicConfigAddScheduledExecutorConfigCodec.REQUEST_DURABILITY_FIELD_OFFSET);
        request.capacity =  FixedSizeTypes.decodeInt(initialFrame.content, DynamicConfigAddScheduledExecutorConfigCodec.REQUEST_CAPACITY_FIELD_OFFSET);
        request.mergeBatchSize =  FixedSizeTypes.decodeInt(initialFrame.content, DynamicConfigAddScheduledExecutorConfigCodec.REQUEST_MERGE_BATCH_SIZE_FIELD_OFFSET);
        request.name = StringCodec.decode(frame);
        request.splitBrainProtectionName = CodecUtil.decodeNullable(frame, StringCodec.decode);
        request.mergePolicy = StringCodec.decode(frame);
        return request;
    }

     static encodeResponse(): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(DynamicConfigAddScheduledExecutorConfigCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, DynamicConfigAddScheduledExecutorConfigCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage): ResponseParameters {
        const response: ResponseParameters = new ResponseParameters();
        // empty initial frame
        let frame: Frame = clientMessage.get();
        frame = frame.next;
        return response;
    }
}
