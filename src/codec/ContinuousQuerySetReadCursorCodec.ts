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
     * Name of the map.
     */
    public mapName: string;

    /**
     * Name of query cache.
     */
    public cacheName: string;

    /**
     * The cursor position of the accumulator to be set.
     */
    public sequence: Long;
}

/* tslint:disable:URF-UNREAD-PUBLIC-OR-PROTECTED-FIELD */
export class ResponseParameters {

    /**
     * True if the cursor position could be set, false otherwise.
     */
    public response: boolean;
}

/**
 * This method can be used to recover from a possible event loss situation.
 * This method tries to make consistent the data in this `QueryCache` with the data in the underlying `IMap`
 * by replaying the events after last consistently received ones. As a result of this replaying logic, same event may
 * appear more than once to the `QueryCache` listeners.
 * This method returns `false` if the event is not in the buffer of event publisher side. That means recovery is not
 * possible.
 */
/* tslint:disable:max-line-length no-bitwise */
export class ContinuousQuerySetReadCursorCodec {
    // hex: 0x180500
    public static REQUEST_MESSAGE_TYPE = 1574144;
    // hex: 0x180501
    public static RESPONSE_MESSAGE_TYPE = 1574145;
    private static REQUEST_SEQUENCE_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = ContinuousQuerySetReadCursorCodec.REQUEST_SEQUENCE_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_RESPONSE_FIELD_OFFSET = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = ContinuousQuerySetReadCursorCodec.RESPONSE_RESPONSE_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;

    static encodeRequest(mapName: string, cacheName: string, sequence: Long): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName('ContinuousQuery.SetReadCursor');
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(ContinuousQuerySetReadCursorCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, ContinuousQuerySetReadCursorCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeLong(initialFrame.content, ContinuousQuerySetReadCursorCodec.REQUEST_SEQUENCE_FIELD_OFFSET, sequence);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, mapName);
        StringCodec.encode(clientMessage, cacheName);
        return clientMessage;
    }

    static decodeRequest(clientMessage: ClientMessage): RequestParameters {
        const request: RequestParameters = new RequestParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        request.sequence =  FixedSizeTypes.decodeLong(initialFrame.content, ContinuousQuerySetReadCursorCodec.REQUEST_SEQUENCE_FIELD_OFFSET);
        request.mapName = StringCodec.decode(frame);
        request.cacheName = StringCodec.decode(frame);
        return request;
    }

     static encodeResponse(response: boolean ): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(ContinuousQuerySetReadCursorCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, ContinuousQuerySetReadCursorCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        FixedSizeTypes.encodeBoolean(initialFrame.content, ContinuousQuerySetReadCursorCodec.RESPONSE_RESPONSE_FIELD_OFFSET, response);
        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage): ResponseParameters {
        const response: ResponseParameters = new ResponseParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        response.response =  FixedSizeTypes.decodeBoolean(initialFrame.content, ContinuousQuerySetReadCursorCodec.RESPONSE_RESPONSE_FIELD_OFFSET);
        return response;
    }
}
