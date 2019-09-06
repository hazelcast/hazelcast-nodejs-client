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
     * Name of the cache.
     */
    public name: string;

    /**
     * The key whose value is replaced.
     */
    public key: Data;

    /**
     * Old value to match if exists before removing. Null means "don't try to remove"
     */
    public oldValue: Data;

    /**
     * The new value to be associated with the specified key.
     */
    public newValue: Data;

    /**
     * Expiry policy for the entry. Byte-array which is serialized from an object implementing
     * javax.cache.expiry.ExpiryPolicy interface.
     */
    public expiryPolicy: Data;

    /**
     * User generated id which shall be received as a field of the cache event upon completion of
     * the request in the cluster.
     */
    public completionId: number;
}

/* tslint:disable:URF-UNREAD-PUBLIC-OR-PROTECTED-FIELD */
export class ResponseParameters {

    /**
     * The replaced value.
     */
    public response: Data;
}

/**
 * Atomically replaces the currently assigned value for the given key with the specified newValue if and only if the
 * currently assigned value equals the value of oldValue using a custom javax.cache.expiry.ExpiryPolicy
 * If the cache is configured for write-through operation mode, the underlying configured
 * javax.cache.integration.CacheWriter might be called to store the value of the key to any kind of external resource.
 */
/* tslint:disable:max-line-length no-bitwise */
export class CacheReplaceCodec {
    // hex: 0x151800
    public static REQUEST_MESSAGE_TYPE = 1382400;
    // hex: 0x151801
    public static RESPONSE_MESSAGE_TYPE = 1382401;
    private static REQUEST_COMPLETION_ID_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = CacheReplaceCodec.REQUEST_COMPLETION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;

    static encodeRequest(name: string, key: Data, oldValue: Data, newValue: Data, expiryPolicy: Data, completionId: number): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName('Cache.Replace');
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(CacheReplaceCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, CacheReplaceCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeInt(initialFrame.content, CacheReplaceCodec.REQUEST_COMPLETION_ID_FIELD_OFFSET, completionId);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, name);
        DataCodec.encode(clientMessage, key);
        CodecUtil.encodeNullable(clientMessage,  oldValue, DataCodec.encode );
        DataCodec.encode(clientMessage, newValue);
        CodecUtil.encodeNullable(clientMessage,  expiryPolicy, DataCodec.encode );
        return clientMessage;
    }

    static decodeRequest(clientMessage: ClientMessage): RequestParameters {
        const request: RequestParameters = new RequestParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        request.completionId =  FixedSizeTypes.decodeInt(initialFrame.content, CacheReplaceCodec.REQUEST_COMPLETION_ID_FIELD_OFFSET);
        request.name = StringCodec.decode(frame);
        request.key = DataCodec.decode(frame);
        request.oldValue = CodecUtil.decodeNullable(frame, DataCodec.decode);
        request.newValue = DataCodec.decode(frame);
        request.expiryPolicy = CodecUtil.decodeNullable(frame, DataCodec.decode);
        return request;
    }

     static encodeResponse(response: Data ): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(CacheReplaceCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, CacheReplaceCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        CodecUtil.encodeNullable(clientMessage,  response, DataCodec.encode );
        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage): ResponseParameters {
        const response: ResponseParameters = new ResponseParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        response.response = CodecUtil.decodeNullable(frame, DataCodec.decode);
        return response;
    }
}
