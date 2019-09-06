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
     * The name of the scheduler.
     */
    public schedulerName: string;

    /**
     * The address of the member where the task will get scheduled.
     */
    public address: Address;

    /**
     * type of schedule logic, values 0 for SINGLE_RUN, 1 for AT_FIXED_RATE
     */
    public type: number;

    /**
     * The name of the task
     */
    public taskName: string;

    /**
     * Name The name of the task
     */
    public task: Data;

    /**
     * initial delay in milliseconds
     */
    public initialDelayInMillis: Long;

    /**
     * period between each run in milliseconds
     */
    public periodInMillis: Long;
}

/* tslint:disable:URF-UNREAD-PUBLIC-OR-PROTECTED-FIELD */
export class ResponseParameters {
}

/**
 * Submits the task to a member for execution, member is provided in the form of an address.
 */
/* tslint:disable:max-line-length no-bitwise */
export class ScheduledExecutorSubmitToAddressCodec {
    // hex: 0x1D0300
    public static REQUEST_MESSAGE_TYPE = 1901312;
    // hex: 0x1D0301
    public static RESPONSE_MESSAGE_TYPE = 1901313;
    private static REQUEST_TYPE_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_DELAY_IN_MILLIS_FIELD_OFFSET = ScheduledExecutorSubmitToAddressCodec.REQUEST_TYPE_FIELD_OFFSET + FixedSizeTypes.BYTE_SIZE_IN_BYTES;
    private static REQUEST_PERIOD_IN_MILLIS_FIELD_OFFSET = ScheduledExecutorSubmitToAddressCodec.REQUEST_INITIAL_DELAY_IN_MILLIS_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = ScheduledExecutorSubmitToAddressCodec.REQUEST_PERIOD_IN_MILLIS_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;

    static encodeRequest(schedulerName: string, address: Address, type: number, taskName: string, task: Data, initialDelayInMillis: Long, periodInMillis: Long): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName('ScheduledExecutor.SubmitToAddress');
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(ScheduledExecutorSubmitToAddressCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, ScheduledExecutorSubmitToAddressCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeByte(initialFrame.content, ScheduledExecutorSubmitToAddressCodec.REQUEST_TYPE_FIELD_OFFSET, type);
        FixedSizeTypes.encodeLong(initialFrame.content, ScheduledExecutorSubmitToAddressCodec.REQUEST_INITIAL_DELAY_IN_MILLIS_FIELD_OFFSET, initialDelayInMillis);
        FixedSizeTypes.encodeLong(initialFrame.content, ScheduledExecutorSubmitToAddressCodec.REQUEST_PERIOD_IN_MILLIS_FIELD_OFFSET, periodInMillis);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, schedulerName);
        AddressCodec.encode(clientMessage, address);
        StringCodec.encode(clientMessage, taskName);
        DataCodec.encode(clientMessage, task);
        return clientMessage;
    }

    static decodeRequest(clientMessage: ClientMessage): RequestParameters {
        const request: RequestParameters = new RequestParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        request.type =  FixedSizeTypes.decodeByte(initialFrame.content, ScheduledExecutorSubmitToAddressCodec.REQUEST_TYPE_FIELD_OFFSET);
        request.initialDelayInMillis =  FixedSizeTypes.decodeLong(initialFrame.content, ScheduledExecutorSubmitToAddressCodec.REQUEST_INITIAL_DELAY_IN_MILLIS_FIELD_OFFSET);
        request.periodInMillis =  FixedSizeTypes.decodeLong(initialFrame.content, ScheduledExecutorSubmitToAddressCodec.REQUEST_PERIOD_IN_MILLIS_FIELD_OFFSET);
        request.schedulerName = StringCodec.decode(frame);
        request.address = AddressCodec.decode(frame);
        request.taskName = StringCodec.decode(frame);
        request.task = DataCodec.decode(frame);
        return request;
    }

     static encodeResponse(): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(ScheduledExecutorSubmitToAddressCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, ScheduledExecutorSubmitToAddressCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage): ResponseParameters {
        const response: ResponseParameters = new ResponseParameters();
        // empty initial frame
        let frame: Frame = clientMessage.get();
        frame = frame.next;
        return response;
    }
}
