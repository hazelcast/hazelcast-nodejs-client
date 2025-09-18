"use strict";
/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberInfoCodec = void 0;
/* eslint-disable max-len */
const FixSizedTypesCodec_1 = require("../builtin/FixSizedTypesCodec");
const BitsUtil_1 = require("../../util/BitsUtil");
const ClientMessage_1 = require("../../protocol/ClientMessage");
const CodecUtil_1 = require("../builtin/CodecUtil");
const MemberInfo_1 = require("../../core/MemberInfo");
const AddressCodec_1 = require("./AddressCodec");
const MapCodec_1 = require("../builtin/MapCodec");
const StringCodec_1 = require("../builtin/StringCodec");
const MemberVersionCodec_1 = require("./MemberVersionCodec");
const EndpointQualifierCodec_1 = require("./EndpointQualifierCodec");
const UUID_OFFSET = 0;
const LITE_MEMBER_OFFSET = UUID_OFFSET + BitsUtil_1.BitsUtil.UUID_SIZE_IN_BYTES;
const INITIAL_FRAME_SIZE = LITE_MEMBER_OFFSET + BitsUtil_1.BitsUtil.BOOLEAN_SIZE_IN_BYTES;
/** @internal */
class MemberInfoCodec {
    static encode(clientMessage, memberInfo) {
        clientMessage.addFrame(ClientMessage_1.BEGIN_FRAME.copy());
        const initialFrame = ClientMessage_1.Frame.createInitialFrame(INITIAL_FRAME_SIZE, ClientMessage_1.DEFAULT_FLAGS);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeUUID(initialFrame.content, UUID_OFFSET, memberInfo.uuid);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeBoolean(initialFrame.content, LITE_MEMBER_OFFSET, memberInfo.liteMember);
        clientMessage.addFrame(initialFrame);
        AddressCodec_1.AddressCodec.encode(clientMessage, memberInfo.address);
        MapCodec_1.MapCodec.encode(clientMessage, memberInfo.attributes, StringCodec_1.StringCodec.encode, StringCodec_1.StringCodec.encode);
        MemberVersionCodec_1.MemberVersionCodec.encode(clientMessage, memberInfo.version);
        MapCodec_1.MapCodec.encode(clientMessage, memberInfo.addressMap, EndpointQualifierCodec_1.EndpointQualifierCodec.encode, AddressCodec_1.AddressCodec.encode);
        clientMessage.addFrame(ClientMessage_1.END_FRAME.copy());
    }
    static decode(clientMessage) {
        // begin frame
        clientMessage.nextFrame();
        const initialFrame = clientMessage.nextFrame();
        const uuid = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeUUID(initialFrame.content, UUID_OFFSET);
        const liteMember = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeBoolean(initialFrame.content, LITE_MEMBER_OFFSET);
        const address = AddressCodec_1.AddressCodec.decode(clientMessage);
        const attributes = MapCodec_1.MapCodec.decode(clientMessage, StringCodec_1.StringCodec.decode, StringCodec_1.StringCodec.decode);
        const version = MemberVersionCodec_1.MemberVersionCodec.decode(clientMessage);
        let isAddressMapExists = false;
        let addressMap = null;
        if (!clientMessage.peekNextFrame().isEndFrame()) {
            addressMap = MapCodec_1.MapCodec.decode(clientMessage, EndpointQualifierCodec_1.EndpointQualifierCodec.decode, AddressCodec_1.AddressCodec.decode);
            isAddressMapExists = true;
        }
        CodecUtil_1.CodecUtil.fastForwardToEndFrame(clientMessage);
        return new MemberInfo_1.MemberInfo(address, uuid, attributes, liteMember, version, isAddressMapExists, addressMap);
    }
}
exports.MemberInfoCodec = MemberInfoCodec;
//# sourceMappingURL=MemberInfoCodec.js.map