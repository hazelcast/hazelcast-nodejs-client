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
         * if true only master node sends events, otherwise all registered nodes send all membership
         * changes.
         */
        public localOnly: boolean;
    };

    /* tslint:disable:urf-unread-public-or-protected-field */
   export class ResponseParameters {

        /**
         * Returns the registration id for the listener.
         */
        public response : string;
    };

/**
 * TODO DOC
 */
export class ClientAddMembershipListenerCodec {
    //hex: 0x000400
    public static REQUEST_MESSAGE_TYPE = 1024;
    //hex: 0x000401
    public static RESPONSE_MESSAGE_TYPE = 1025;
    private static REQUEST_LOCAL_ONLY_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = ClientAddMembershipListenerCodec.REQUEST_LOCAL_ONLY_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    static EVENT_MEMBER_EVENT_TYPE_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    static EVENT_MEMBER_INITIAL_FRAME_SIZE = ClientAddMembershipListenerCodec.EVENT_MEMBER_EVENT_TYPE_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    //hex: 0x000402
    static EVENT_MEMBER_MESSAGE_TYPE = 1026;
    static EVENT_MEMBER_LIST_INITIAL_FRAME_SIZE = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    //hex: 0x000403
    static EVENT_MEMBER_LIST_MESSAGE_TYPE = 1027;
    static EVENT_MEMBER_ATTRIBUTE_CHANGE_OPERATION_TYPE_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    static EVENT_MEMBER_ATTRIBUTE_CHANGE_INITIAL_FRAME_SIZE = ClientAddMembershipListenerCodec.EVENT_MEMBER_ATTRIBUTE_CHANGE_OPERATION_TYPE_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    //hex: 0x000404
    static EVENT_MEMBER_ATTRIBUTE_CHANGE_MESSAGE_TYPE = 1028;

    private ClientAddMembershipListenerCodec() {
    }


    static encodeRequest(localOnly: boolean) {
        var clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName("Client.AddMembershipListener");
        var initialFrame : Frame= new Frame(Buffer.allocUnsafe(ClientAddMembershipListenerCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, ClientAddMembershipListenerCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeBoolean(initialFrame.content, ClientAddMembershipListenerCodec.REQUEST_LOCAL_ONLY_FIELD_OFFSET, localOnly);
        clientMessage.add(initialFrame);
        return clientMessage;
    }

    static decodeRequest(clientMessage : ClientMessage) {
        var frame : Frame = clientMessage.get();
        var request : RequestParameters = new RequestParameters();
        var initialFrame : Frame= frame.next;
        request.localOnly =  FixedSizeTypes.decodeBoolean(initialFrame.content, ClientAddMembershipListenerCodec.REQUEST_LOCAL_ONLY_FIELD_OFFSET);
        return request;
    }


     static encodeResponse(response: string ) {
        var clientMessage = ClientMessage.createForEncode();
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(ClientAddMembershipListenerCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, ClientAddMembershipListenerCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        StringCodec.encode(clientMessage, response);
        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage) {
        var frame : Frame = clientMessage.get();
        var response : ResponseParameters = new ResponseParameters();
        //empty initial frame
        frame = frame.next;
        response.response = StringCodec.decode(frame);
        return response;
    }

     static encodeMemberEvent( member : Member,  eventType : number) {
        var clientMessage = ClientMessage.createForEncode();
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(ClientAddMembershipListenerCodec.EVENT_MEMBER_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        initialFrame.flags |= ClientMessage.IS_EVENT_FLAG;
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, ClientAddMembershipListenerCodec.EVENT_MEMBER_MESSAGE_TYPE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientAddMembershipListenerCodec.EVENT_MEMBER_EVENT_TYPE_FIELD_OFFSET, eventType);
        clientMessage.add(initialFrame);
        MemberCodec.encode(clientMessage, member);
        return clientMessage;
    }
     static encodeMemberListEvent( members : Array<Member>) {
        var clientMessage = ClientMessage.createForEncode();
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(ClientAddMembershipListenerCodec.EVENT_MEMBER_LIST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        initialFrame.flags |= ClientMessage.IS_EVENT_FLAG;
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, ClientAddMembershipListenerCodec.EVENT_MEMBER_LIST_MESSAGE_TYPE);
        clientMessage.add(initialFrame);
        ListMultiFrameCodec.encode(clientMessage, members , MemberCodec.encode);
        return clientMessage;
    }
     static encodeMemberAttributeChangeEvent( member : Member,  members : Array<Member>,  key : string,  operationType : number,  value : string) {
        var clientMessage = ClientMessage.createForEncode();
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(ClientAddMembershipListenerCodec.EVENT_MEMBER_ATTRIBUTE_CHANGE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        initialFrame.flags |= ClientMessage.IS_EVENT_FLAG;
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, ClientAddMembershipListenerCodec.EVENT_MEMBER_ATTRIBUTE_CHANGE_MESSAGE_TYPE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientAddMembershipListenerCodec.EVENT_MEMBER_ATTRIBUTE_CHANGE_OPERATION_TYPE_FIELD_OFFSET, operationType);
        clientMessage.add(initialFrame);
        MemberCodec.encode(clientMessage, member);
        ListMultiFrameCodec.encode(clientMessage, members , MemberCodec.encode);
        StringCodec.encode(clientMessage, key);
        CodecUtil.encodeNullable(clientMessage,  value , StringCodec.encode );
        return clientMessage;
    }

static handle(clientMessage : ClientMessage, handleEventEntry: any, toObjectFunction: (data: Data) => any = null) {
            var messageType = clientMessage.getMessageType();
            var frame : Frame = clientMessage.get();
            if (messageType == ClientAddMembershipListenerCodec.EVENT_MEMBER_MESSAGE_TYPE) {
                var initialFrame : Frame = frame.next;
                var eventType : number  = FixedSizeTypes.decodeInt(initialFrame.content, ClientAddMembershipListenerCodec.EVENT_MEMBER_EVENT_TYPE_FIELD_OFFSET);
                var member : Member = MemberCodec.decode(frame);
                handleEventEntry(member, eventType);
                return;
            }
            if (messageType == ClientAddMembershipListenerCodec.EVENT_MEMBER_LIST_MESSAGE_TYPE) {
                frame = frame.next;
                var members : Array<Member> = ListMultiFrameCodec.decode(frame, MemberCodec.decode);
                handleEventEntry(members);
                return;
            }
            if (messageType == ClientAddMembershipListenerCodec.EVENT_MEMBER_ATTRIBUTE_CHANGE_MESSAGE_TYPE) {
                var initialFrame : Frame = frame.next;
                var operationType : number  = FixedSizeTypes.decodeInt(initialFrame.content, ClientAddMembershipListenerCodec.EVENT_MEMBER_ATTRIBUTE_CHANGE_OPERATION_TYPE_FIELD_OFFSET);
                var member : Member = MemberCodec.decode(frame);
                var members : Array<Member> = ListMultiFrameCodec.decode(frame, MemberCodec.decode);
                var key : string = StringCodec.decode(frame);
                var value : string = CodecUtil.decodeNullable(frame, StringCodec.decode);
                handleEventEntry(member, members, key, operationType, value);
                return;
            }
        }
}