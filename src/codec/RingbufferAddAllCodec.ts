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
         * the batch of items to add
         */
        public valueList: Array<Data>;

        /**
         * the overflowPolicy to use
         */
        public overflowPolicy: number;
    };

    /* tslint:disable:urf-unread-public-or-protected-field */
   export class ResponseParameters {

        /**
         * the ICompletableFuture to synchronize on completion.
         */
        public response : Long;
    };

/**
 * Adds all the items of a collection to the tail of the Ringbuffer. A addAll is likely to outperform multiple calls
 * to add(Object) due to better io utilization and a reduced number of executed operations. If the batch is empty,
 * the call is ignored. When the collection is not empty, the content is copied into a different data-structure.
 * This means that: after this call completes, the collection can be re-used. the collection doesn't need to be serializable.
 * If the collection is larger than the capacity of the ringbuffer, then the items that were written first will be
 * overwritten. Therefor this call will not block. The items are inserted in the order of the Iterator of the collection.
 * If an addAll is executed concurrently with an add or addAll, no guarantee is given that items are contiguous.
 * The result of the future contains the sequenceId of the last written item
 */
export class RingbufferAddAllCodec {
    //hex: 0x190900
    public static REQUEST_MESSAGE_TYPE = 1640704;
    //hex: 0x190901
    public static RESPONSE_MESSAGE_TYPE = 1640705;
    private static REQUEST_OVERFLOW_POLICY_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = RingbufferAddAllCodec.REQUEST_OVERFLOW_POLICY_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static RESPONSE_RESPONSE_FIELD_OFFSET = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = RingbufferAddAllCodec.RESPONSE_RESPONSE_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;

    private RingbufferAddAllCodec() {
    }


    static encodeRequest(name: string, valueList: Array<Data>, overflowPolicy: number) {
        var clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName("Ringbuffer.AddAll");
        var initialFrame : Frame= new Frame(Buffer.allocUnsafe(RingbufferAddAllCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, RingbufferAddAllCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeInt(initialFrame.content, RingbufferAddAllCodec.REQUEST_OVERFLOW_POLICY_FIELD_OFFSET, overflowPolicy);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, name);
        ListMultiFrameCodec.encode(clientMessage, valueList , DataCodec.encode);
        return clientMessage;
    }

    static decodeRequest(clientMessage : ClientMessage) {
        var frame : Frame = clientMessage.get();
        var request : RequestParameters = new RequestParameters();
        var initialFrame : Frame= frame.next;
        request.overflowPolicy =  FixedSizeTypes.decodeInt(initialFrame.content, RingbufferAddAllCodec.REQUEST_OVERFLOW_POLICY_FIELD_OFFSET);
        request.name = StringCodec.decode(frame);
        request.valueList = ListMultiFrameCodec.decode(frame, DataCodec.decode);
        return request;
    }


     static encodeResponse(response: Long ) {
        var clientMessage = ClientMessage.createForEncode();
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(RingbufferAddAllCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, RingbufferAddAllCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        FixedSizeTypes.encodeLong(initialFrame.content, RingbufferAddAllCodec.RESPONSE_RESPONSE_FIELD_OFFSET, response);
        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage) {
        var frame : Frame = clientMessage.get();
        var response : ResponseParameters = new ResponseParameters();
        var initialFrame : Frame = frame.next;
        response.response =  FixedSizeTypes.decodeLong(initialFrame.content, RingbufferAddAllCodec.RESPONSE_RESPONSE_FIELD_OFFSET);
        return response;
    }


static handle(clientMessage : ClientMessage,  toObjectFunction: (data: Data) => any = null) {
            var messageType = clientMessage.getMessageType();
            var frame : Frame = clientMessage.get();
        }
}