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
         * the sequence of the item to read.
         */
        public sequence: Long;
    };

    /* tslint:disable:urf-unread-public-or-protected-field */
   export class ResponseParameters {

        /**
         * the read item
         */
        public response : Data;
    };

/**
 * Reads one item from the Ringbuffer. If the sequence is one beyond the current tail, this call blocks until an
 * item is added. This method is not destructive unlike e.g. a queue.take. So the same item can be read by multiple
 * readers or it can be read multiple times by the same reader. Currently it isn't possible to control how long this
 * call is going to block. In the future we could add e.g. tryReadOne(long sequence, long timeout, TimeUnit unit).
 */
export class RingbufferReadOneCodec {
    //hex: 0x190800
    public static REQUEST_MESSAGE_TYPE = 1640448;
    //hex: 0x190801
    public static RESPONSE_MESSAGE_TYPE = 1640449;
    private static REQUEST_SEQUENCE_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = RingbufferReadOneCodec.REQUEST_SEQUENCE_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;

    private RingbufferReadOneCodec() {
    }


    static encodeRequest(name: string, sequence: Long) {
        var clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName("Ringbuffer.ReadOne");
        var initialFrame : Frame= new Frame(Buffer.allocUnsafe(RingbufferReadOneCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, RingbufferReadOneCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeLong(initialFrame.content, RingbufferReadOneCodec.REQUEST_SEQUENCE_FIELD_OFFSET, sequence);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, name);
        return clientMessage;
    }

    static decodeRequest(clientMessage : ClientMessage) {
        var frame : Frame = clientMessage.get();
        var request : RequestParameters = new RequestParameters();
        var initialFrame : Frame= frame.next;
        request.sequence =  FixedSizeTypes.decodeLong(initialFrame.content, RingbufferReadOneCodec.REQUEST_SEQUENCE_FIELD_OFFSET);
        request.name = StringCodec.decode(frame);
        return request;
    }


     static encodeResponse(response: Data ) {
        var clientMessage = ClientMessage.createForEncode();
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(RingbufferReadOneCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, RingbufferReadOneCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        CodecUtil.encodeNullable(clientMessage,  response , DataCodec.encode );
        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage) {
        var frame : Frame = clientMessage.get();
        var response : ResponseParameters = new ResponseParameters();
        //empty initial frame
        frame = frame.next;
        response.response = CodecUtil.decodeNullable(frame, DataCodec.decode);
        return response;
    }


static handle(clientMessage : ClientMessage, handleEventEntry: any, toObjectFunction: (data: Data) => any = null) {
            var messageType = clientMessage.getMessageType();
            var frame : Frame = clientMessage.get();
        }
}