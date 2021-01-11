/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import {MemberCodec} from './MemberCodec';
import {Data} from '../serialization/Data';
import {ClientMessageType} from './ClientMessageType';

var REQUEST_TYPE = ClientMessageType.CLIENT_ADDMEMBERSHIPLISTENER;
var RESPONSE_TYPE = 104;
var RETRYABLE = false;


export class ClientAddMembershipListenerCodec {


    static calculateSize(localOnly: boolean) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(localOnly: boolean) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(localOnly));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendBoolean(localOnly);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
        // Decode response from client message
        var parameters: any = {
            'response': null
        };

        parameters['response'] = clientMessage.readString();

        return parameters;
    }

    static handle(clientMessage: ClientMessage, handleEventMember: any, handleEventMemberlist: any, handleEventMemberattributechange: any, toObjectFunction: (data: Data) => any = null) {

        var messageType = clientMessage.getMessageType();
        if (messageType === BitsUtil.EVENT_MEMBER && handleEventMember !== null) {
            var messageFinished = false;
            var member: any = undefined;
            if (!messageFinished) {
                member = MemberCodec.decode(clientMessage, toObjectFunction);
            }
            var eventType: number = undefined;
            if (!messageFinished) {
                eventType = clientMessage.readInt32();
            }
            handleEventMember(member, eventType);
        }
        if (messageType === BitsUtil.EVENT_MEMBERLIST && handleEventMemberlist !== null) {
            var messageFinished = false;
            var members: any = undefined;
            if (!messageFinished) {

                var membersSize = clientMessage.readInt32();
                members = [];
                for (var membersIndex = 0; membersIndex < membersSize; membersIndex++) {
                    var membersItem: any;
                    membersItem = MemberCodec.decode(clientMessage, toObjectFunction);
                    members.push(membersItem);
                }
            }
            handleEventMemberlist(members);
        }
        if (messageType === BitsUtil.EVENT_MEMBERATTRIBUTECHANGE && handleEventMemberattributechange !== null) {
            var messageFinished = false;
            var uuid: string = undefined;
            if (!messageFinished) {
                uuid = clientMessage.readString();
            }
            var key: string = undefined;
            if (!messageFinished) {
                key = clientMessage.readString();
            }
            var operationType: number = undefined;
            if (!messageFinished) {
                operationType = clientMessage.readInt32();
            }
            var value: string = undefined;
            if (!messageFinished) {

                if (clientMessage.readBoolean() !== true) {
                    value = clientMessage.readString();
                }
            }
            handleEventMemberattributechange(uuid, key, operationType, value);
        }
    }

}
