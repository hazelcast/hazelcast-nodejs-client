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
         * semaphore configuration name
         */
        public name: string;

        /**
         * thread count to which the concurrent access is limited
         */
        public initialPermits: number;

        /**
         * number of synchronous backups
         */
        public backupCount: number;

        /**
         * number of asynchronous backups
         */
        public asyncBackupCount: number;

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
 * Adds a new semaphore configuration to a running cluster.
 * If a semaphore configuration with the given {@code name} already exists, then
 * the new configuration is ignored and the existing one is preserved.
 */
export class DynamicConfigAddSemaphoreConfigCodec {
    //hex: 0x1E0C00
    public static REQUEST_MESSAGE_TYPE = 1969152;
    //hex: 0x1E0C01
    public static RESPONSE_MESSAGE_TYPE = 1969153;
    private static REQUEST_INITIAL_PERMITS_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_BACKUP_COUNT_FIELD_OFFSET = DynamicConfigAddSemaphoreConfigCodec.REQUEST_INITIAL_PERMITS_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_ASYNC_BACKUP_COUNT_FIELD_OFFSET = DynamicConfigAddSemaphoreConfigCodec.REQUEST_BACKUP_COUNT_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = DynamicConfigAddSemaphoreConfigCodec.REQUEST_ASYNC_BACKUP_COUNT_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;

    private DynamicConfigAddSemaphoreConfigCodec() {
    }


    static encodeRequest(name: string, initialPermits: number, backupCount: number, asyncBackupCount: number, quorumName: string) {
        var clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName("DynamicConfig.AddSemaphoreConfig");
        var initialFrame : Frame= new Frame(Buffer.allocUnsafe(DynamicConfigAddSemaphoreConfigCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, DynamicConfigAddSemaphoreConfigCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeInt(initialFrame.content, DynamicConfigAddSemaphoreConfigCodec.REQUEST_INITIAL_PERMITS_FIELD_OFFSET, initialPermits);
        FixedSizeTypes.encodeInt(initialFrame.content, DynamicConfigAddSemaphoreConfigCodec.REQUEST_BACKUP_COUNT_FIELD_OFFSET, backupCount);
        FixedSizeTypes.encodeInt(initialFrame.content, DynamicConfigAddSemaphoreConfigCodec.REQUEST_ASYNC_BACKUP_COUNT_FIELD_OFFSET, asyncBackupCount);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, name);
        CodecUtil.encodeNullable(clientMessage,  quorumName , StringCodec.encode );
        return clientMessage;
    }

    static decodeRequest(clientMessage : ClientMessage) {
        var frame : Frame = clientMessage.get();
        var request : RequestParameters = new RequestParameters();
        var initialFrame : Frame= frame.next;
        request.initialPermits =  FixedSizeTypes.decodeInt(initialFrame.content, DynamicConfigAddSemaphoreConfigCodec.REQUEST_INITIAL_PERMITS_FIELD_OFFSET);
        request.backupCount =  FixedSizeTypes.decodeInt(initialFrame.content, DynamicConfigAddSemaphoreConfigCodec.REQUEST_BACKUP_COUNT_FIELD_OFFSET);
        request.asyncBackupCount =  FixedSizeTypes.decodeInt(initialFrame.content, DynamicConfigAddSemaphoreConfigCodec.REQUEST_ASYNC_BACKUP_COUNT_FIELD_OFFSET);
        request.name = StringCodec.decode(frame);
        request.quorumName = CodecUtil.decodeNullable(frame, StringCodec.decode);
        return request;
    }


     static encodeResponse() {
        var clientMessage = ClientMessage.createForEncode();
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(DynamicConfigAddSemaphoreConfigCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, DynamicConfigAddSemaphoreConfigCodec.RESPONSE_MESSAGE_TYPE);
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


static handle(clientMessage : ClientMessage, handleEventEntry: any, toObjectFunction: (data: Data) => any = null) {
            var messageType = clientMessage.getMessageType();
            var frame : Frame = clientMessage.get();
        }
}