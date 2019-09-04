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
         * topic's name
         */
        public name: string;

        /**
         * when {@code true} all nodes listening to the same topic get their messages in
         * the same order
         */
        public globalOrderingEnabled: boolean;

        /**
         * {@code true} to enable gathering of statistics, otherwise {@code false}
         */
        public statisticsEnabled: boolean;

        /**
         * {@code true} to enable multi-threaded processing of incoming messages, otherwise
         * a single thread will handle all topic messages
         */
        public multiThreadingEnabled: boolean;

        /**
         * message listener configurations
         */
        public listenerConfigs: Array<ListenerConfigHolder>;
    };

    /* tslint:disable:urf-unread-public-or-protected-field */
   export class ResponseParameters {
    };

/**
 * Adds a new topic configuration to a running cluster.
 * If a topic configuration with the given {@code name} already exists, then
 * the new configuration is ignored and the existing one is preserved.
 */
export class DynamicConfigAddTopicConfigCodec {
    //hex: 0x1E0800
    public static REQUEST_MESSAGE_TYPE = 1968128;
    //hex: 0x1E0801
    public static RESPONSE_MESSAGE_TYPE = 1968129;
    private static REQUEST_GLOBAL_ORDERING_ENABLED_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_STATISTICS_ENABLED_FIELD_OFFSET = DynamicConfigAddTopicConfigCodec.REQUEST_GLOBAL_ORDERING_ENABLED_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;
    private static REQUEST_MULTI_THREADING_ENABLED_FIELD_OFFSET = DynamicConfigAddTopicConfigCodec.REQUEST_STATISTICS_ENABLED_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = DynamicConfigAddTopicConfigCodec.REQUEST_MULTI_THREADING_ENABLED_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;

    private DynamicConfigAddTopicConfigCodec() {
    }


    static encodeRequest(name: string, globalOrderingEnabled: boolean, statisticsEnabled: boolean, multiThreadingEnabled: boolean, listenerConfigs: Array<ListenerConfigHolder>) {
        var clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName("DynamicConfig.AddTopicConfig");
        var initialFrame : Frame= new Frame(Buffer.allocUnsafe(DynamicConfigAddTopicConfigCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, DynamicConfigAddTopicConfigCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeBoolean(initialFrame.content, DynamicConfigAddTopicConfigCodec.REQUEST_GLOBAL_ORDERING_ENABLED_FIELD_OFFSET, globalOrderingEnabled);
        FixedSizeTypes.encodeBoolean(initialFrame.content, DynamicConfigAddTopicConfigCodec.REQUEST_STATISTICS_ENABLED_FIELD_OFFSET, statisticsEnabled);
        FixedSizeTypes.encodeBoolean(initialFrame.content, DynamicConfigAddTopicConfigCodec.REQUEST_MULTI_THREADING_ENABLED_FIELD_OFFSET, multiThreadingEnabled);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, name);
        ListMultiFrameCodec.encodeNullable(clientMessage, listenerConfigs , ListenerConfigHolderCodec.encode);
        return clientMessage;
    }

    static decodeRequest(clientMessage : ClientMessage) {
        var frame : Frame = clientMessage.get();
        var request : RequestParameters = new RequestParameters();
        var initialFrame : Frame= frame.next;
        request.globalOrderingEnabled =  FixedSizeTypes.decodeBoolean(initialFrame.content, DynamicConfigAddTopicConfigCodec.REQUEST_GLOBAL_ORDERING_ENABLED_FIELD_OFFSET);
        request.statisticsEnabled =  FixedSizeTypes.decodeBoolean(initialFrame.content, DynamicConfigAddTopicConfigCodec.REQUEST_STATISTICS_ENABLED_FIELD_OFFSET);
        request.multiThreadingEnabled =  FixedSizeTypes.decodeBoolean(initialFrame.content, DynamicConfigAddTopicConfigCodec.REQUEST_MULTI_THREADING_ENABLED_FIELD_OFFSET);
        request.name = StringCodec.decode(frame);
        request.listenerConfigs = ListMultiFrameCodec.decodeNullable(frame, ListenerConfigHolderCodec.decode);
        return request;
    }


     static encodeResponse() {
        var clientMessage = ClientMessage.createForEncode();
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(DynamicConfigAddTopicConfigCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, DynamicConfigAddTopicConfigCodec.RESPONSE_MESSAGE_TYPE);
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