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
import ClientMessage = require('../ClientMessage');
import Address = require('../Address');
import {Member} from '../core/Member';
import {AddressCodec} from './AddressCodec';

export class MemberCodec {

    static encode(clientMessage: ClientMessage, member: Member): void {
        AddressCodec.encode(clientMessage, member.address);
        clientMessage.appendString(member.uuid);
        clientMessage.appendBoolean(member.isLiteMember);
        var keys = Object.keys(member.attributes);
        clientMessage.appendInt32(keys.length);
        for (var key in keys) {
            clientMessage.appendString(key);
            clientMessage.appendString(member.attributes[key]);
        }
    }

    static decode(clientMessage: ClientMessage, toObject: Function) {
        var address: Address = AddressCodec.decode(clientMessage, toObject);
        var uuid = clientMessage.readString();
        var liteMember = clientMessage.readBoolean();
        var attributeSize = clientMessage.readInt32();
        var attributes: any = {};
        for (var i = 0; i < attributeSize; i++) {
            var key = clientMessage.readString();
            var val = clientMessage.readString();
            attributes[key] = val;
        }
        return new Member(address, uuid, liteMember, attributes);
    }
}
