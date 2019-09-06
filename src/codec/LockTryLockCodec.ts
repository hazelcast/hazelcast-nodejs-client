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
     * Name of the Lock
     */
    public name: string;

    /**
     * The id of the user thread performing the operation. It is used to guarantee that only the lock holder thread (if a lock exists on the entry) can perform the requested operation.
     */
    public threadId: Long;

    /**
     * time in milliseconds to wait before releasing the lock.
     */
    public lease: Long;

    /**
     * Maximum time to wait for the lock.
     */
    public timeout: Long;

    /**
     * The client-wide unique id for this request. It is used to make the request idempotent by sending the same reference id during retries.
     */
    public referenceId: Long;
}

/* tslint:disable:URF-UNREAD-PUBLIC-OR-PROTECTED-FIELD */
export class ResponseParameters {

    /**
     * true if the lock was acquired and false if the waiting time elapsed before the lock was acquired.
     */
    public response: boolean;
}

/**
 * Tries to acquire the lock for the specified lease time.After lease time, the lock will be released.
 * If the lock is not available, then the current thread becomes disabled for thread scheduling purposes and lies
 * dormant until one of two things happens: the lock is acquired by the current thread, or the specified waiting
 * time elapses.
 */
/* tslint:disable:max-line-length no-bitwise */
export class LockTryLockCodec {
    // hex: 0x070800
    public static REQUEST_MESSAGE_TYPE = 460800;
    // hex: 0x070801
    public static RESPONSE_MESSAGE_TYPE = 460801;
    private static REQUEST_THREAD_ID_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_LEASE_FIELD_OFFSET = LockTryLockCodec.REQUEST_THREAD_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static REQUEST_TIMEOUT_FIELD_OFFSET = LockTryLockCodec.REQUEST_LEASE_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static REQUEST_REFERENCE_ID_FIELD_OFFSET = LockTryLockCodec.REQUEST_TIMEOUT_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = LockTryLockCodec.REQUEST_REFERENCE_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_RESPONSE_FIELD_OFFSET = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = LockTryLockCodec.RESPONSE_RESPONSE_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;

    static encodeRequest(name: string, threadId: Long, lease: Long, timeout: Long, referenceId: Long): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);
        clientMessage.setAcquiresResource(true);
        clientMessage.setOperationName('Lock.TryLock');
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(LockTryLockCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, LockTryLockCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeLong(initialFrame.content, LockTryLockCodec.REQUEST_THREAD_ID_FIELD_OFFSET, threadId);
        FixedSizeTypes.encodeLong(initialFrame.content, LockTryLockCodec.REQUEST_LEASE_FIELD_OFFSET, lease);
        FixedSizeTypes.encodeLong(initialFrame.content, LockTryLockCodec.REQUEST_TIMEOUT_FIELD_OFFSET, timeout);
        FixedSizeTypes.encodeLong(initialFrame.content, LockTryLockCodec.REQUEST_REFERENCE_ID_FIELD_OFFSET, referenceId);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, name);
        return clientMessage;
    }

    static decodeRequest(clientMessage: ClientMessage): RequestParameters {
        const request: RequestParameters = new RequestParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        request.threadId =  FixedSizeTypes.decodeLong(initialFrame.content, LockTryLockCodec.REQUEST_THREAD_ID_FIELD_OFFSET);
        request.lease =  FixedSizeTypes.decodeLong(initialFrame.content, LockTryLockCodec.REQUEST_LEASE_FIELD_OFFSET);
        request.timeout =  FixedSizeTypes.decodeLong(initialFrame.content, LockTryLockCodec.REQUEST_TIMEOUT_FIELD_OFFSET);
        request.referenceId =  FixedSizeTypes.decodeLong(initialFrame.content, LockTryLockCodec.REQUEST_REFERENCE_ID_FIELD_OFFSET);
        request.name = StringCodec.decode(frame);
        return request;
    }

     static encodeResponse(response: boolean ): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(LockTryLockCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, LockTryLockCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        FixedSizeTypes.encodeBoolean(initialFrame.content, LockTryLockCodec.RESPONSE_RESPONSE_FIELD_OFFSET, response);
        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage): ResponseParameters {
        const response: ResponseParameters = new ResponseParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        response.response =  FixedSizeTypes.decodeBoolean(initialFrame.content, LockTryLockCodec.RESPONSE_RESPONSE_FIELD_OFFSET);
        return response;
    }
}
