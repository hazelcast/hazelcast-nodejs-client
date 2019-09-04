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
         * name of {@code FlakeIdGenerator}
         */
        public name: string;

        /**
         * how many IDs are pre-fetched on the background when one call to {@code newId()} is made
         */
        public prefetchCount: number;

        /**
         * for how long the pre-fetched IDs can be used
         */
        public prefetchValidity: Long;

        /**
         * TODO DOC
         */
        public idOffset: Long;

        /**
         * {@code true} to enable gathering of statistics, otherwise {@code false}
         */
        public statisticsEnabled: boolean;

        /**
         * TODO DOC
         */
        public nodeIdOffset: Long;
    };

    /* tslint:disable:urf-unread-public-or-protected-field */
   export class ResponseParameters {
    };

/**
 * Adds a new flake ID generator configuration to a running cluster.
 * If a flake ID generator configuration for the same name already exists, then
 * the new configuration is ignored and the existing one is preserved.
 */
export class DynamicConfigAddFlakeIdGeneratorConfigCodec {
    //hex: 0x1E1200
    public static REQUEST_MESSAGE_TYPE = 1970688;
    //hex: 0x1E1201
    public static RESPONSE_MESSAGE_TYPE = 1970689;
    private static REQUEST_PREFETCH_COUNT_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_PREFETCH_VALIDITY_FIELD_OFFSET = DynamicConfigAddFlakeIdGeneratorConfigCodec.REQUEST_PREFETCH_COUNT_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_ID_OFFSET_FIELD_OFFSET = DynamicConfigAddFlakeIdGeneratorConfigCodec.REQUEST_PREFETCH_VALIDITY_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static REQUEST_STATISTICS_ENABLED_FIELD_OFFSET = DynamicConfigAddFlakeIdGeneratorConfigCodec.REQUEST_ID_OFFSET_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static REQUEST_NODE_ID_OFFSET_FIELD_OFFSET = DynamicConfigAddFlakeIdGeneratorConfigCodec.REQUEST_STATISTICS_ENABLED_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = DynamicConfigAddFlakeIdGeneratorConfigCodec.REQUEST_NODE_ID_OFFSET_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;

    private DynamicConfigAddFlakeIdGeneratorConfigCodec() {
    }


    static encodeRequest(name: string, prefetchCount: number, prefetchValidity: Long, idOffset: Long, statisticsEnabled: boolean, nodeIdOffset: Long) {
        var clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName("DynamicConfig.AddFlakeIdGeneratorConfig");
        var initialFrame : Frame= new Frame(Buffer.allocUnsafe(DynamicConfigAddFlakeIdGeneratorConfigCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, DynamicConfigAddFlakeIdGeneratorConfigCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeInt(initialFrame.content, DynamicConfigAddFlakeIdGeneratorConfigCodec.REQUEST_PREFETCH_COUNT_FIELD_OFFSET, prefetchCount);
        FixedSizeTypes.encodeLong(initialFrame.content, DynamicConfigAddFlakeIdGeneratorConfigCodec.REQUEST_PREFETCH_VALIDITY_FIELD_OFFSET, prefetchValidity);
        FixedSizeTypes.encodeLong(initialFrame.content, DynamicConfigAddFlakeIdGeneratorConfigCodec.REQUEST_ID_OFFSET_FIELD_OFFSET, idOffset);
        FixedSizeTypes.encodeBoolean(initialFrame.content, DynamicConfigAddFlakeIdGeneratorConfigCodec.REQUEST_STATISTICS_ENABLED_FIELD_OFFSET, statisticsEnabled);
        FixedSizeTypes.encodeLong(initialFrame.content, DynamicConfigAddFlakeIdGeneratorConfigCodec.REQUEST_NODE_ID_OFFSET_FIELD_OFFSET, nodeIdOffset);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, name);
        return clientMessage;
    }

    static decodeRequest(clientMessage : ClientMessage) {
        var frame : Frame = clientMessage.get();
        var request : RequestParameters = new RequestParameters();
        var initialFrame : Frame= frame.next;
        request.prefetchCount =  FixedSizeTypes.decodeInt(initialFrame.content, DynamicConfigAddFlakeIdGeneratorConfigCodec.REQUEST_PREFETCH_COUNT_FIELD_OFFSET);
        request.prefetchValidity =  FixedSizeTypes.decodeLong(initialFrame.content, DynamicConfigAddFlakeIdGeneratorConfigCodec.REQUEST_PREFETCH_VALIDITY_FIELD_OFFSET);
        request.idOffset =  FixedSizeTypes.decodeLong(initialFrame.content, DynamicConfigAddFlakeIdGeneratorConfigCodec.REQUEST_ID_OFFSET_FIELD_OFFSET);
        request.statisticsEnabled =  FixedSizeTypes.decodeBoolean(initialFrame.content, DynamicConfigAddFlakeIdGeneratorConfigCodec.REQUEST_STATISTICS_ENABLED_FIELD_OFFSET);
        request.nodeIdOffset =  FixedSizeTypes.decodeLong(initialFrame.content, DynamicConfigAddFlakeIdGeneratorConfigCodec.REQUEST_NODE_ID_OFFSET_FIELD_OFFSET);
        request.name = StringCodec.decode(frame);
        return request;
    }


     static encodeResponse() {
        var clientMessage = ClientMessage.createForEncode();
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(DynamicConfigAddFlakeIdGeneratorConfigCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, DynamicConfigAddFlakeIdGeneratorConfigCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage) {
        var frame : Frame = clientMessage.get();
        var response : ResponseParameters = new ResponseParameters();
        //empty initial frame
        frame = frame.next;
        return response;
    }


static handle(clientMessage : ClientMessage,  toObjectFunction: (data: Data) => any = null) {
            var messageType = clientMessage.getMessageType();
            var frame : Frame = clientMessage.get();
        }
}