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
     * Name of the Condition
     */
    public name: string;

    /**
     * The id of the user thread performing the operation. It is used to guarantee that only the lock holder thread (if a lock exists on the entry) can perform the requested operation.
     */
    public threadId: Long;

    /**
     * Name of the lock to wait on.
     */
    public lockName: string;

    /**
     * The client-wide unique id for this request. It is used to make the request idempotent by sending the same reference id during retries.
     */
    public referenceId: Long;
}

/* tslint:disable:URF-UNREAD-PUBLIC-OR-PROTECTED-FIELD */
export class ResponseParameters {
}

/**
 * Causes the current thread to wait until it is signalled or Thread#interrupt interrupted. The lock associated with
 * this Condition is atomically released and the current thread becomes disabled for thread scheduling purposes and
 * lies dormant until one of four things happens:
 * Some other thread invokes the #signal method for this Condition and the current thread happens to be chosen as the
 * thread to be awakened; or Some other thread invokes the #signalAll method for this Condition; or Some other thread
 * Thread#interrupt interrupts the current thread, and interruption of thread suspension is supported; or A spurious wakeup occurs.
 * In all cases, before this method can return the current thread must re-acquire the lock associated with this condition.
 * When the thread returns it is guaranteed to hold this lock. If the current thread: has its interrupted status set
 * on entry to this method; or is Thread#interrupt interrupted while waiting and interruption of thread suspension
 * is supported, then INTERRUPTED is thrown and the current thread's interrupted status is cleared. It is
 * not specified, in the first case, whether or not the test for interruption occurs before the lock is released.
 * The current thread is assumed to hold the lock associated with this Condition when this method is called.
 * It is up to the implementation to determine if this is the case and if not, how to respond. Typically, an exception will be
 * thrown (such as ILLEGAL_MONITOR_STATE) and the implementation must document that fact.
 * An implementation can favor responding to an interrupt over normal method return in response to a signal. In that
 * case the implementation must ensure that the signal is redirected to another waiting thread, if there is one.
 */
/* tslint:disable:max-line-length no-bitwise */
export class ConditionBeforeAwaitCodec {
    // hex: 0x080200
    public static REQUEST_MESSAGE_TYPE = 524800;
    // hex: 0x080201
    public static RESPONSE_MESSAGE_TYPE = 524801;
    private static REQUEST_THREAD_ID_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_REFERENCE_ID_FIELD_OFFSET = ConditionBeforeAwaitCodec.REQUEST_THREAD_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = ConditionBeforeAwaitCodec.REQUEST_REFERENCE_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;

    static encodeRequest(name: string, threadId: Long, lockName: string, referenceId: Long): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName('Condition.BeforeAwait');
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(ConditionBeforeAwaitCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, ConditionBeforeAwaitCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeLong(initialFrame.content, ConditionBeforeAwaitCodec.REQUEST_THREAD_ID_FIELD_OFFSET, threadId);
        FixedSizeTypes.encodeLong(initialFrame.content, ConditionBeforeAwaitCodec.REQUEST_REFERENCE_ID_FIELD_OFFSET, referenceId);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, name);
        StringCodec.encode(clientMessage, lockName);
        return clientMessage;
    }

    static decodeRequest(clientMessage: ClientMessage): RequestParameters {
        const request: RequestParameters = new RequestParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        request.threadId =  FixedSizeTypes.decodeLong(initialFrame.content, ConditionBeforeAwaitCodec.REQUEST_THREAD_ID_FIELD_OFFSET);
        request.referenceId =  FixedSizeTypes.decodeLong(initialFrame.content, ConditionBeforeAwaitCodec.REQUEST_REFERENCE_ID_FIELD_OFFSET);
        request.name = StringCodec.decode(frame);
        request.lockName = StringCodec.decode(frame);
        return request;
    }

     static encodeResponse(): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(ConditionBeforeAwaitCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, ConditionBeforeAwaitCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage): ResponseParameters {
        const response: ResponseParameters = new ResponseParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        return response;
    }
}
