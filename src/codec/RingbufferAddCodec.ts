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
import * as Long from 'long';
import {Address} from '../Address';
import {AddressCodec} from'../builtin/AddressCodec';
import {MemberCodec} from '../builtin/MemberCodec';
import {Data} from '../serialization/Data';
import {SimpleEntryViewCodec} from '../builtin/SimpleEntryViewCodec';
import {DistributedObjectInfoCodec} from '../builtin/DistributedObjectInfoCodec';
import {DistributedObjectInfo} from '../builtin/DistributedObjectInfo';
import {Member} from '../core/Member';
import {UUID} from '../core/UUID';
import {FixedSizeTypes} from '../builtin/FixedSizeTypes'
import {BitsUtil} from '../BitsUtil'
import {ClientConnection} from '../invocation/ClientConnection'
import {ClientMessage, Frame} from '../ClientMessage'
import {Buffer} from 'safe-buffer'
import {ClientProtocolErrorCodes} from '../protocol/ClientProtocolErrorCodes'
import {CodecUtil} from '../builtin/CodecUtil'
import {DataCodec} from '../builtin/DataCodec'
import {ErrorCodec} from '../protocol/ErrorCodec'
import {ErrorsCodec} from '../protocol/ErrorsCodec'
import {ListIntegerCodec} from '../builtin/ListIntegerCodec'
import {ListUUIDCodec} from '../builtin/ListUUIDCodec'
import {ListLongCodec} from '../builtin/ListLongCodec'
import {ListMultiFrameCodec} from '../builtin/ListMultiFrameCodec'
import {LongArrayCodec} from '../builtin/LongArrayCodec'
import {MapCodec} from '../builtin/MapCodec'
import {MapIntegerLongCodec} from '../builtin/MapIntegerLongCodec'
import {MapIntegerUUIDCodec} from '../builtin/MapIntegerUUIDCodec'
import {MapStringLongCodec} from '../builtin/MapStringLongCodec'
import {MapUUIDLongCodec} from '../builtin/MapUUIDLongCodec'
import {StackTraceElementCodec} from '../protocol/StackTraceElementCodec'
import {StringCodec} from '../builtin/StringCodec'

    /* tslint:disabled:URF-UNREAD-PUBLIC-OR-PROTECTED-FIELD */
   export class RequestParameters {

        /**
         * Name of the Ringbuffer
         */
        public name: string;

        /**
         * the OverflowPolicy to use.
         */
        public overflowPolicy: number;

        /**
         * to item to add
         */
        public value: Data;
    };

    /* tslint:disable:urf-unread-public-or-protected-field */
   export class ResponseParameters {

        /**
         * the sequence of the added item, or -1 if the add failed.
         */
        public response : Long;
    };

/**
 * Adds an item to the tail of the Ringbuffer. If there is space in the ringbuffer, the call
 * will return the sequence of the written item. If there is no space, it depends on the overflow policy what happens:
 * OverflowPolicy OVERWRITE we just overwrite the oldest item in the ringbuffer and we violate the ttl
 * OverflowPolicy FAIL we return -1. The reason that FAIL exist is to give the opportunity to obey the ttl.
 * <p/>
 * This sequence will always be unique for this Ringbuffer instance so it can be used as a unique id generator if you are
 * publishing items on this Ringbuffer. However you need to take care of correctly determining an initial id when any node
 * uses the ringbuffer for the first time. The most reliable way to do that is to write a dummy item into the ringbuffer and
 * use the returned sequence as initial  id. On the reading side, this dummy item should be discard. Please keep in mind that
 * this id is not the sequence of the item you are about to publish but from a previously published item. So it can't be used
 * to find that item.
 */
export class RingbufferAddCodec {
    //hex: 0x190600
    public static REQUEST_MESSAGE_TYPE = 1639936;
    //hex: 0x190601
    public static RESPONSE_MESSAGE_TYPE = 1639937;
    private static REQUEST_OVERFLOW_POLICY_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = RingbufferAddCodec.REQUEST_OVERFLOW_POLICY_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static RESPONSE_RESPONSE_FIELD_OFFSET = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = RingbufferAddCodec.RESPONSE_RESPONSE_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;

    private RingbufferAddCodec() {
    }


    static encodeRequest(name: string, overflowPolicy: number, value: Data) {
        var clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName("Ringbuffer.Add");
        var initialFrame : Frame= new Frame(Buffer.allocUnsafe(RingbufferAddCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, RingbufferAddCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeInt(initialFrame.content, RingbufferAddCodec.REQUEST_OVERFLOW_POLICY_FIELD_OFFSET, overflowPolicy);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, name);
        DataCodec.encode(clientMessage, value);
        return clientMessage;
    }

    static decodeRequest(clientMessage : ClientMessage) {
        var frame : Frame = clientMessage.get();
        var request : RequestParameters = new RequestParameters();
        var initialFrame : Frame= frame.next;
        request.overflowPolicy =  FixedSizeTypes.decodeInt(initialFrame.content, RingbufferAddCodec.REQUEST_OVERFLOW_POLICY_FIELD_OFFSET);
        request.name = StringCodec.decode(frame);
        request.value = DataCodec.decode(frame);
        return request;
    }


     static encodeResponse(response: Long ) {
        var clientMessage = ClientMessage.createForEncode();
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(RingbufferAddCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, RingbufferAddCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        FixedSizeTypes.encodeLong(initialFrame.content, RingbufferAddCodec.RESPONSE_RESPONSE_FIELD_OFFSET, response);
        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage) {
        var frame : Frame = clientMessage.get();
        var response : ResponseParameters = new ResponseParameters();
        var initialFrame : Frame = frame.next;
        response.response =  FixedSizeTypes.decodeLong(initialFrame.content, RingbufferAddCodec.RESPONSE_RESPONSE_FIELD_OFFSET);
        return response;
    }


static handle(clientMessage : ClientMessage, handleEventEntry: any, toObjectFunction: (data: Data) => any = null) {
            var messageType = clientMessage.getMessageType();
            var frame : Frame = clientMessage.get();
        }
}