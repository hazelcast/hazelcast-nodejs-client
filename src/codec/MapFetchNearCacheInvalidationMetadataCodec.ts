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
         * names of the maps
         */
        public names: Array<string>;

        /**
         * TODO DOC
         */
        public address: Address;
    };

    /* tslint:disable:urf-unread-public-or-protected-field */
   export class ResponseParameters {

        /**
         * TODO DOC
         */
        public namePartitionSequenceList : Array<[string, Array<[number,Long]>]>;

        /**
         * TODO DOC
         */
        public partitionUuidList : Array<[number,UUID]>;
    };

/**
 * Fetches invalidation metadata from partitions of map.
 */
export class MapFetchNearCacheInvalidationMetadataCodec {
    //hex: 0x014200
    public static REQUEST_MESSAGE_TYPE = 82432;
    //hex: 0x014201
    public static RESPONSE_MESSAGE_TYPE = 82433;
    private static REQUEST_INITIAL_FRAME_SIZE = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;

    private MapFetchNearCacheInvalidationMetadataCodec() {
    }


    static encodeRequest(names: Array<string>, address: Address) {
        var clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName("Map.FetchNearCacheInvalidationMetadata");
        var initialFrame : Frame= new Frame(Buffer.allocUnsafe(MapFetchNearCacheInvalidationMetadataCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, MapFetchNearCacheInvalidationMetadataCodec.REQUEST_MESSAGE_TYPE);
        clientMessage.add(initialFrame);
        ListMultiFrameCodec.encode(clientMessage, names , StringCodec.encode);
        AddressCodec.encode(clientMessage, address);
        return clientMessage;
    }

    static decodeRequest(clientMessage : ClientMessage) {
        var frame : Frame = clientMessage.get();
        var request : RequestParameters = new RequestParameters();
        //empty initial frame
        frame = frame.next;
        request.names = ListMultiFrameCodec.decode(frame, StringCodec.decode);
        request.address = AddressCodec.decode(frame);
        return request;
    }


     static encodeResponse(namePartitionSequenceList: Array<[string, Array<[number,Long]>]> , partitionUuidList: Array<[number, UUID]> ) {
        var clientMessage = ClientMessage.createForEncode();
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(MapFetchNearCacheInvalidationMetadataCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, MapFetchNearCacheInvalidationMetadataCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        MapCodec.encode(clientMessage, namePartitionSequenceList ,StringCodec.encode,  MapIntegerLongCodec.encode);
        MapIntegerUUIDCodec.encode(clientMessage, partitionUuidList);
        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage) {
        var frame : Frame = clientMessage.get();
        var response : ResponseParameters = new ResponseParameters();
        //empty initial frame
        frame = frame.next;
        response.namePartitionSequenceList = MapCodec.decode(frame, StringCodec.decode, MapIntegerLongCodec.decode);
        response.partitionUuidList = MapIntegerUUIDCodec.decode(frame);
        return response;
    }


static handle(clientMessage : ClientMessage, handleEventEntry: any, toObjectFunction: (data: Data) => any = null) {
            var messageType = clientMessage.getMessageType();
            var frame : Frame = clientMessage.get();
        }
}