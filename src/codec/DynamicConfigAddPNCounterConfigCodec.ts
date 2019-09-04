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
         * name of the CRDT PN counter configuration
         */
        public name: string;

        /**
         * number of replicas on which the CRDT state is kept
         */
        public replicaCount: number;

        /**
         * set to {@code true} to enable statistics on this multimap configuration
         */
        public statisticsEnabled: boolean;

        /**
         * name of an existing configured quorum to be used to determine the minimum number of members
         * required in the cluster for the lock to remain functional. When {@code null}, quorum does not
         * apply to this lock configuration's operations.
         */
        public quorumName: string;
    };

    /* tslint:disable:urf-unread-public-or-protected-field */
   export class ResponseParameters {
    };

/**
 * Adds a new CRDT PN counter configuration to a running cluster.
 * If a PN counter configuration with the given {@code name} already exists, then
 * the new configuration is ignored and the existing one is preserved.
 */
export class DynamicConfigAddPNCounterConfigCodec {
    //hex: 0x1E1600
    public static REQUEST_MESSAGE_TYPE = 1971712;
    //hex: 0x1E1601
    public static RESPONSE_MESSAGE_TYPE = 1971713;
    private static REQUEST_REPLICA_COUNT_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_STATISTICS_ENABLED_FIELD_OFFSET = DynamicConfigAddPNCounterConfigCodec.REQUEST_REPLICA_COUNT_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = DynamicConfigAddPNCounterConfigCodec.REQUEST_STATISTICS_ENABLED_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;

    private DynamicConfigAddPNCounterConfigCodec() {
    }


    static encodeRequest(name: string, replicaCount: number, statisticsEnabled: boolean, quorumName: string) {
        var clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName("DynamicConfig.AddPNCounterConfig");
        var initialFrame : Frame= new Frame(Buffer.allocUnsafe(DynamicConfigAddPNCounterConfigCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, DynamicConfigAddPNCounterConfigCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeInt(initialFrame.content, DynamicConfigAddPNCounterConfigCodec.REQUEST_REPLICA_COUNT_FIELD_OFFSET, replicaCount);
        FixedSizeTypes.encodeBoolean(initialFrame.content, DynamicConfigAddPNCounterConfigCodec.REQUEST_STATISTICS_ENABLED_FIELD_OFFSET, statisticsEnabled);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, name);
        CodecUtil.encodeNullable(clientMessage,  quorumName , StringCodec.encode );
        return clientMessage;
    }

    static decodeRequest(clientMessage : ClientMessage) {
        var frame : Frame = clientMessage.get();
        var request : RequestParameters = new RequestParameters();
        var initialFrame : Frame= frame.next;
        request.replicaCount =  FixedSizeTypes.decodeInt(initialFrame.content, DynamicConfigAddPNCounterConfigCodec.REQUEST_REPLICA_COUNT_FIELD_OFFSET);
        request.statisticsEnabled =  FixedSizeTypes.decodeBoolean(initialFrame.content, DynamicConfigAddPNCounterConfigCodec.REQUEST_STATISTICS_ENABLED_FIELD_OFFSET);
        request.name = StringCodec.decode(frame);
        request.quorumName = CodecUtil.decodeNullable(frame, StringCodec.decode);
        return request;
    }


     static encodeResponse() {
        var clientMessage = ClientMessage.createForEncode();
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(DynamicConfigAddPNCounterConfigCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, DynamicConfigAddPNCounterConfigCodec.RESPONSE_MESSAGE_TYPE);
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