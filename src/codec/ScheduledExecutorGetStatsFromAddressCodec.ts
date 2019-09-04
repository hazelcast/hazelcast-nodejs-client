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
         * The name of the scheduler.
         */
        public schedulerName: string;

        /**
         * The name of the task
         */
        public taskName: string;

        /**
         * The address of the member where the task will get scheduled.
         */
        public address: Address;
    };

    /* tslint:disable:urf-unread-public-or-protected-field */
   export class ResponseParameters {

        /**
         * TODO DOC
         */
        public lastIdleTimeNanos : Long;

        /**
         * TODO DOC
         */
        public totalIdleTimeNanos : Long;

        /**
         * TODO DOC
         */
        public totalRuns : Long;

        /**
         * TODO DOC
         */
        public totalRunTimeNanos : Long;

        /**
         * TODO DOC
         */
        public lastRunDurationNanos : Long;
    };

/**
 * Returns statistics of the task
 */
export class ScheduledExecutorGetStatsFromAddressCodec {
    //hex: 0x1D0600
    public static REQUEST_MESSAGE_TYPE = 1902080;
    //hex: 0x1D0601
    public static RESPONSE_MESSAGE_TYPE = 1902081;
    private static REQUEST_INITIAL_FRAME_SIZE = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static RESPONSE_LAST_IDLE_TIME_NANOS_FIELD_OFFSET = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_TOTAL_IDLE_TIME_NANOS_FIELD_OFFSET = ScheduledExecutorGetStatsFromAddressCodec.RESPONSE_LAST_IDLE_TIME_NANOS_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_TOTAL_RUNS_FIELD_OFFSET = ScheduledExecutorGetStatsFromAddressCodec.RESPONSE_TOTAL_IDLE_TIME_NANOS_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_TOTAL_RUN_TIME_NANOS_FIELD_OFFSET = ScheduledExecutorGetStatsFromAddressCodec.RESPONSE_TOTAL_RUNS_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_LAST_RUN_DURATION_NANOS_FIELD_OFFSET = ScheduledExecutorGetStatsFromAddressCodec.RESPONSE_TOTAL_RUN_TIME_NANOS_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = ScheduledExecutorGetStatsFromAddressCodec.RESPONSE_LAST_RUN_DURATION_NANOS_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;

    private ScheduledExecutorGetStatsFromAddressCodec() {
    }


    static encodeRequest(schedulerName: string, taskName: string, address: Address) {
        var clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName("ScheduledExecutor.GetStatsFromAddress");
        var initialFrame : Frame= new Frame(Buffer.allocUnsafe(ScheduledExecutorGetStatsFromAddressCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, ScheduledExecutorGetStatsFromAddressCodec.REQUEST_MESSAGE_TYPE);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, schedulerName);
        StringCodec.encode(clientMessage, taskName);
        AddressCodec.encode(clientMessage, address);
        return clientMessage;
    }

    static decodeRequest(clientMessage : ClientMessage) {
        var frame : Frame = clientMessage.get();
        var request : RequestParameters = new RequestParameters();
        //empty initial frame
        frame = frame.next;
        request.schedulerName = StringCodec.decode(frame);
        request.taskName = StringCodec.decode(frame);
        request.address = AddressCodec.decode(frame);
        return request;
    }


     static encodeResponse(lastIdleTimeNanos: Long , totalIdleTimeNanos: Long , totalRuns: Long , totalRunTimeNanos: Long , lastRunDurationNanos: Long ) {
        var clientMessage = ClientMessage.createForEncode();
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(ScheduledExecutorGetStatsFromAddressCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, ScheduledExecutorGetStatsFromAddressCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        FixedSizeTypes.encodeLong(initialFrame.content, ScheduledExecutorGetStatsFromAddressCodec.RESPONSE_LAST_IDLE_TIME_NANOS_FIELD_OFFSET, lastIdleTimeNanos);
        FixedSizeTypes.encodeLong(initialFrame.content, ScheduledExecutorGetStatsFromAddressCodec.RESPONSE_TOTAL_IDLE_TIME_NANOS_FIELD_OFFSET, totalIdleTimeNanos);
        FixedSizeTypes.encodeLong(initialFrame.content, ScheduledExecutorGetStatsFromAddressCodec.RESPONSE_TOTAL_RUNS_FIELD_OFFSET, totalRuns);
        FixedSizeTypes.encodeLong(initialFrame.content, ScheduledExecutorGetStatsFromAddressCodec.RESPONSE_TOTAL_RUN_TIME_NANOS_FIELD_OFFSET, totalRunTimeNanos);
        FixedSizeTypes.encodeLong(initialFrame.content, ScheduledExecutorGetStatsFromAddressCodec.RESPONSE_LAST_RUN_DURATION_NANOS_FIELD_OFFSET, lastRunDurationNanos);
        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage) {
        var frame : Frame = clientMessage.get();
        var response : ResponseParameters = new ResponseParameters();
        var initialFrame : Frame = frame.next;
        response.lastIdleTimeNanos =  FixedSizeTypes.decodeLong(initialFrame.content, ScheduledExecutorGetStatsFromAddressCodec.RESPONSE_LAST_IDLE_TIME_NANOS_FIELD_OFFSET);
        response.totalIdleTimeNanos =  FixedSizeTypes.decodeLong(initialFrame.content, ScheduledExecutorGetStatsFromAddressCodec.RESPONSE_TOTAL_IDLE_TIME_NANOS_FIELD_OFFSET);
        response.totalRuns =  FixedSizeTypes.decodeLong(initialFrame.content, ScheduledExecutorGetStatsFromAddressCodec.RESPONSE_TOTAL_RUNS_FIELD_OFFSET);
        response.totalRunTimeNanos =  FixedSizeTypes.decodeLong(initialFrame.content, ScheduledExecutorGetStatsFromAddressCodec.RESPONSE_TOTAL_RUN_TIME_NANOS_FIELD_OFFSET);
        response.lastRunDurationNanos =  FixedSizeTypes.decodeLong(initialFrame.content, ScheduledExecutorGetStatsFromAddressCodec.RESPONSE_LAST_RUN_DURATION_NANOS_FIELD_OFFSET);
        return response;
    }


static handle(clientMessage : ClientMessage,  toObjectFunction: (data: Data) => any = null) {
            var messageType = clientMessage.getMessageType();
            var frame : Frame = clientMessage.get();
        }
}