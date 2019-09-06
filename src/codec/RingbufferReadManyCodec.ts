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
     * Name of the Ringbuffer
     */
    public name: string;

    /**
     * the startSequence of the first item to read
     */
    public startSequence: Long;

    /**
     * the minimum number of items to read.
     */
    public minCount: number;

    /**
     * the maximum number of items to read.
     */
    public maxCount: number;

    /**
     * Filter is allowed to be null, indicating there is no filter.
     */
    public filter: Data;
}

/* tslint:disable:URF-UNREAD-PUBLIC-OR-PROTECTED-FIELD */
export class ResponseParameters {

    /**
     * TODO DOC
     */
    public readCount: number;

    /**
     * TODO DOC
     */
    public items: Array<Data>;

    /**
     * TODO DOC
     */
    public itemSeqs: Array<Long>;

    /**
     * TODO DOC
     */
    public nextSeq: Long;
}

/**
 * Reads a batch of items from the Ringbuffer. If the number of available items after the first read item is smaller
 * than the maxCount, these items are returned. So it could be the number of items read is smaller than the maxCount.
 * If there are less items available than minCount, then this call blacks. Reading a batch of items is likely to
 * perform better because less overhead is involved. A filter can be provided to only select items that need to be read.
 * If the filter is null, all items are read. If the filter is not null, only items where the filter function returns
 * true are returned. Using filters is a good way to prevent getting items that are of no value to the receiver.
 * This reduces the amount of IO and the number of operations being executed, and can result in a significant performance improvement.
 */
/* tslint:disable:max-line-length no-bitwise */
export class RingbufferReadManyCodec {
    // hex: 0x190A00
    public static REQUEST_MESSAGE_TYPE = 1640960;
    // hex: 0x190A01
    public static RESPONSE_MESSAGE_TYPE = 1640961;
    private static REQUEST_START_SEQUENCE_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_MIN_COUNT_FIELD_OFFSET = RingbufferReadManyCodec.REQUEST_START_SEQUENCE_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static REQUEST_MAX_COUNT_FIELD_OFFSET = RingbufferReadManyCodec.REQUEST_MIN_COUNT_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = RingbufferReadManyCodec.REQUEST_MAX_COUNT_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static RESPONSE_READ_COUNT_FIELD_OFFSET = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_NEXT_SEQ_FIELD_OFFSET = RingbufferReadManyCodec.RESPONSE_READ_COUNT_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = RingbufferReadManyCodec.RESPONSE_NEXT_SEQ_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;

    static encodeRequest(name: string, startSequence: Long, minCount: number, maxCount: number, filter: Data): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName('Ringbuffer.ReadMany');
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(RingbufferReadManyCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, RingbufferReadManyCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeLong(initialFrame.content, RingbufferReadManyCodec.REQUEST_START_SEQUENCE_FIELD_OFFSET, startSequence);
        FixedSizeTypes.encodeInt(initialFrame.content, RingbufferReadManyCodec.REQUEST_MIN_COUNT_FIELD_OFFSET, minCount);
        FixedSizeTypes.encodeInt(initialFrame.content, RingbufferReadManyCodec.REQUEST_MAX_COUNT_FIELD_OFFSET, maxCount);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, name);
        CodecUtil.encodeNullable(clientMessage,  filter, DataCodec.encode );
        return clientMessage;
    }

    static decodeRequest(clientMessage: ClientMessage): RequestParameters {
        const request: RequestParameters = new RequestParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        request.startSequence =  FixedSizeTypes.decodeLong(initialFrame.content, RingbufferReadManyCodec.REQUEST_START_SEQUENCE_FIELD_OFFSET);
        request.minCount =  FixedSizeTypes.decodeInt(initialFrame.content, RingbufferReadManyCodec.REQUEST_MIN_COUNT_FIELD_OFFSET);
        request.maxCount =  FixedSizeTypes.decodeInt(initialFrame.content, RingbufferReadManyCodec.REQUEST_MAX_COUNT_FIELD_OFFSET);
        request.name = StringCodec.decode(frame);
        request.filter = CodecUtil.decodeNullable(frame, DataCodec.decode);
        return request;
    }

     static encodeResponse(readCount: number , items: Array<Data> , itemSeqs: Array<Long> , nextSeq: Long ): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(RingbufferReadManyCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, RingbufferReadManyCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        FixedSizeTypes.encodeInt(initialFrame.content, RingbufferReadManyCodec.RESPONSE_READ_COUNT_FIELD_OFFSET, readCount);
        FixedSizeTypes.encodeLong(initialFrame.content, RingbufferReadManyCodec.RESPONSE_NEXT_SEQ_FIELD_OFFSET, nextSeq);
        ListMultiFrameCodec.encode(clientMessage, items , DataCodec.encode);
        CodecUtil.encodeNullable(clientMessage,  itemSeqs, LongArrayCodec.encode );
        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage): ResponseParameters {
        const response: ResponseParameters = new ResponseParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        response.readCount =  FixedSizeTypes.decodeInt(initialFrame.content, RingbufferReadManyCodec.RESPONSE_READ_COUNT_FIELD_OFFSET);
        response.nextSeq =  FixedSizeTypes.decodeLong(initialFrame.content, RingbufferReadManyCodec.RESPONSE_NEXT_SEQ_FIELD_OFFSET);
        response.items = ListMultiFrameCodec.decode(frame, DataCodec.decode);
        response.itemSeqs = CodecUtil.decodeNullable(frame, LongArrayCodec.decode);
        return response;
    }
}
