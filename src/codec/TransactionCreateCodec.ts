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
     * The maximum allowed duration for the transaction operations.
     */
    public timeout: Long;

    /**
     * The durability of the transaction
     */
    public durability: number;

    /**
     * Identifies the type of the transaction. Possible values are:
     * 1 (Two phase):  The two phase commit is more than the classic two phase commit (if you want a regular
     * two phase commit, use local). Before it commits, it copies the commit-log to other members, so in
     * case of member failure, another member can complete the commit.
     * 2 (Local): Unlike the name suggests, local is a two phase commit. So first all cohorts are asked
     * to prepare if everyone agrees then all cohorts are asked to commit. The problem happens when during
     * the commit phase one or more members crash, that the system could be left in an inconsistent state.
     */
    public transactionType: number;

    /**
     * The thread id for the transaction.
     */
    public threadId: Long;
}

/* tslint:disable:URF-UNREAD-PUBLIC-OR-PROTECTED-FIELD */
export class ResponseParameters {

    /**
     * The transaction id for the created transaction.
     */
    public response: string;
}

/**
 * TODO DOC
 */
/* tslint:disable:max-line-length no-bitwise */
export class TransactionCreateCodec {
    // hex: 0x170200
    public static REQUEST_MESSAGE_TYPE = 1507840;
    // hex: 0x170201
    public static RESPONSE_MESSAGE_TYPE = 1507841;
    private static REQUEST_TIMEOUT_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_DURABILITY_FIELD_OFFSET = TransactionCreateCodec.REQUEST_TIMEOUT_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static REQUEST_TRANSACTION_TYPE_FIELD_OFFSET = TransactionCreateCodec.REQUEST_DURABILITY_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_THREAD_ID_FIELD_OFFSET = TransactionCreateCodec.REQUEST_TRANSACTION_TYPE_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = TransactionCreateCodec.REQUEST_THREAD_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;

    static encodeRequest(timeout: Long, durability: number, transactionType: number, threadId: Long): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setAcquiresResource(true);
        clientMessage.setOperationName('Transaction.Create');
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(TransactionCreateCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, TransactionCreateCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeLong(initialFrame.content, TransactionCreateCodec.REQUEST_TIMEOUT_FIELD_OFFSET, timeout);
        FixedSizeTypes.encodeInt(initialFrame.content, TransactionCreateCodec.REQUEST_DURABILITY_FIELD_OFFSET, durability);
        FixedSizeTypes.encodeInt(initialFrame.content, TransactionCreateCodec.REQUEST_TRANSACTION_TYPE_FIELD_OFFSET, transactionType);
        FixedSizeTypes.encodeLong(initialFrame.content, TransactionCreateCodec.REQUEST_THREAD_ID_FIELD_OFFSET, threadId);
        clientMessage.add(initialFrame);
        return clientMessage;
    }

    static decodeRequest(clientMessage: ClientMessage): RequestParameters {
        const request: RequestParameters = new RequestParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        request.timeout =  FixedSizeTypes.decodeLong(initialFrame.content, TransactionCreateCodec.REQUEST_TIMEOUT_FIELD_OFFSET);
        request.durability =  FixedSizeTypes.decodeInt(initialFrame.content, TransactionCreateCodec.REQUEST_DURABILITY_FIELD_OFFSET);
        request.transactionType =  FixedSizeTypes.decodeInt(initialFrame.content, TransactionCreateCodec.REQUEST_TRANSACTION_TYPE_FIELD_OFFSET);
        request.threadId =  FixedSizeTypes.decodeLong(initialFrame.content, TransactionCreateCodec.REQUEST_THREAD_ID_FIELD_OFFSET);
        return request;
    }

     static encodeResponse(response: string ): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(TransactionCreateCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, TransactionCreateCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        StringCodec.encode(clientMessage, response);
        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage): ResponseParameters {
        const response: ResponseParameters = new ResponseParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        response.response = StringCodec.decode(frame);
        return response;
    }
}
