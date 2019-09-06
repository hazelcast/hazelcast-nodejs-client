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
     * the name of the PNCounter
     */
    public name: string;

    /**
     * last observed replica timestamps (vector clock)
     */
    public replicaTimestamps: Array<[string, Long]>;

    /**
     * the target replica
     */
    public targetReplica: Address;
}

/* tslint:disable:URF-UNREAD-PUBLIC-OR-PROTECTED-FIELD */
export class ResponseParameters {

    /**
     * TODO DOC
     */
    public value: Long;

    /**
     * last observed replica timestamps (vector clock)
     */
    public replicaTimestamps: Array<[string, Long]>;

    /**
     * TODO DOC
     */
    public replicaCount: number;
}

/**
 * Query operation to retrieve the current value of the PNCounter.
 * <p>
 * The invocation will return the replica timestamps (vector clock) which
 * can then be sent with the next invocation to keep session consistency
 * guarantees.
 * The target replica is determined by the {@code targetReplica} parameter.
 * If smart routing is disabled, the actual member processing the client
 * message may act as a proxy.
 */
/* tslint:disable:max-line-length no-bitwise */
export class PNCounterGetCodec {
    // hex: 0x200100
    public static REQUEST_MESSAGE_TYPE = 2097408;
    // hex: 0x200101
    public static RESPONSE_MESSAGE_TYPE = 2097409;
    private static REQUEST_INITIAL_FRAME_SIZE = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static RESPONSE_VALUE_FIELD_OFFSET = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_REPLICA_COUNT_FIELD_OFFSET = PNCounterGetCodec.RESPONSE_VALUE_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = PNCounterGetCodec.RESPONSE_REPLICA_COUNT_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;

    static encodeRequest(name: string, replicaTimestamps: Array<[string, Long]>, targetReplica: Address): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName('PNCounter.Get');
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(PNCounterGetCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, PNCounterGetCodec.REQUEST_MESSAGE_TYPE);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, name);
        MapStringLongCodec.encode(clientMessage, replicaTimestamps);
        AddressCodec.encode(clientMessage, targetReplica);
        return clientMessage;
    }

    static decodeRequest(clientMessage: ClientMessage): RequestParameters {
        const request: RequestParameters = new RequestParameters();
        // empty initial frame
        let frame: Frame = clientMessage.get();
        frame = frame.next;
        request.name = StringCodec.decode(frame);
        request.replicaTimestamps = MapStringLongCodec.decode(frame);
        request.targetReplica = AddressCodec.decode(frame);
        return request;
    }

     static encodeResponse(value: Long , replicaTimestamps: Array<[string, Long]> , replicaCount: number ): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(PNCounterGetCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, PNCounterGetCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        FixedSizeTypes.encodeLong(initialFrame.content, PNCounterGetCodec.RESPONSE_VALUE_FIELD_OFFSET, value);
        FixedSizeTypes.encodeInt(initialFrame.content, PNCounterGetCodec.RESPONSE_REPLICA_COUNT_FIELD_OFFSET, replicaCount);
        MapStringLongCodec.encode(clientMessage, replicaTimestamps);
        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage): ResponseParameters {
        const response: ResponseParameters = new ResponseParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        response.value =  FixedSizeTypes.decodeLong(initialFrame.content, PNCounterGetCodec.RESPONSE_VALUE_FIELD_OFFSET);
        response.replicaCount =  FixedSizeTypes.decodeInt(initialFrame.content, PNCounterGetCodec.RESPONSE_REPLICA_COUNT_FIELD_OFFSET);
        response.replicaTimestamps = MapStringLongCodec.decode(frame);
        return response;
    }
}
