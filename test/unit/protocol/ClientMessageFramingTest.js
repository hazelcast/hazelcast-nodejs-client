/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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

'use strict';

const expect = require('chai').expect;
const Long = require('long');

const cm = require('../../../lib/protocol/ClientMessage');
const { HeapData } = require('../../../lib/serialization/HeapData');
const { UUID } = require('../../../lib/core/UUID');
const { ErrorHolder } = require('../../../lib/protocol/ErrorHolder');
const { FixSizedTypesCodec } = require('../../../lib/codec/builtin/FixSizedTypesCodec');
const { StringCodec } = require('../../../lib/codec/builtin/StringCodec');
const { ByteArrayCodec } = require('../../../lib/codec/builtin/ByteArrayCodec');
const { DataCodec } = require('../../../lib/codec/builtin/DataCodec');
const { EntryListCodec } = require('../../../lib/codec/builtin/EntryListCodec');
const { EntryListIntegerLongCodec } = require('../../../lib/codec/builtin/EntryListIntegerLongCodec');
const { EntryListIntegerUUIDCodec } = require('../../../lib/codec/builtin/EntryListIntegerUUIDCodec');
const { EntryListUUIDListIntegerCodec } = require('../../../lib/codec/builtin/EntryListUUIDListIntegerCodec');
const { EntryListUUIDLongCodec } = require('../../../lib/codec/builtin/EntryListUUIDLongCodec');
const { ListMultiFrameCodec } = require('../../../lib/codec/builtin/ListMultiFrameCodec');
const { ErrorHolderCodec } = require('../../../lib/codec/custom/ErrorHolderCodec');
const { ErrorsCodec } = require('../../../lib/codec/builtin/ErrorsCodec');
const { ListIntegerCodec } = require('../../../lib/codec/builtin/ListIntegerCodec');
const { ListLongCodec } = require('../../../lib/codec/builtin/ListLongCodec');
const { ListUUIDCodec } = require('../../../lib/codec/builtin/ListUUIDCodec');
const { MapCodec } = require('../../../lib/codec/builtin/MapCodec');
const { CodecUtil } = require('../../../lib/codec/builtin/CodecUtil');

describe('ClientMessageFramingTest', function () {
    let message;
    let buffer;

    beforeEach(function () {
        buffer = Buffer.allocUnsafe(20);
        message = cm.ClientMessage.createForEncode();
        message.addFrame(new cm.Frame(buffer));
    });

    it('encode/decode byte', function () {
        FixSizedTypesCodec.encodeByte(buffer, 0, 3);
        const content = message.nextFrame().content;
        const decodedByte = FixSizedTypesCodec.decodeByte(content, 0);
        expect(decodedByte).to.equal(3);
    });

    it('encode/decode boolean', function () {
        FixSizedTypesCodec.encodeBoolean(buffer, 0, true);
        const content = message.nextFrame().content;
        const decodedBool = FixSizedTypesCodec.decodeBoolean(content, 0);
        expect(decodedBool).to.equal(true);
    });

    it('encode/decode int', function () {
        FixSizedTypesCodec.encodeInt(buffer, 0, 1234);
        const content = message.nextFrame().content;
        const decodedInt = FixSizedTypesCodec.decodeInt(content, 0);
        expect(decodedInt).to.equal(1234);
    });

    it('encode/decode UUID', function () {
        const uuid = new UUID(Long.fromNumber(0xCAFE), Long.fromNumber(0xBABE));
        FixSizedTypesCodec.encodeUUID(buffer, 0, uuid);
        const content = message.nextFrame().content;
        const decodedUuid = FixSizedTypesCodec.decodeUUID(content, 0);
        expect(decodedUuid).to.deep.equal(uuid);
    });

    it('encode/decode number as long', function () {
        FixSizedTypesCodec.encodeLong(buffer, 0, 12345678);
        const content = message.nextFrame().content;
        const decodedLong = FixSizedTypesCodec.decodeLong(content, 0);
        expect(decodedLong.toNumber()).to.equal(12345678);
    });

    it('encode/decode Long as long', function () {
        FixSizedTypesCodec.encodeLong(buffer, 0, Long.fromNumber(12345678));
        const content = message.nextFrame().content;
        const decodedLong = FixSizedTypesCodec.decodeLong(content, 0);
        expect(decodedLong.toNumber()).to.equal(12345678);
    });

    it('encode/decode buffer', function () {
        const buf = Buffer.from('abc©☺𩸽');
        ByteArrayCodec.encode(message, buf);
        // Initial frame
        message.nextFrame();
        const decodedBuffer = ByteArrayCodec.decode(message);
        expect(decodedBuffer).to.equal(buf);
    });

    it('encode/decode data', function () {
        const data = new HeapData(Buffer.from('123456789'));
        DataCodec.encode(message, data);
        // Initial frame
        message.nextFrame();
        const decodedData = DataCodec.decode(message);
        expect(decodedData.toBuffer()).to.equal(data.toBuffer());
    });

    it('encode/decode generic entry list', function () {
        const entries = [['a', '1'], ['b', '2'], ['c', '3']];
        EntryListCodec.encode(message, entries, StringCodec.encode, StringCodec.encode);
        EntryListCodec.encodeNullable(message, null, StringCodec.encode, StringCodec.encode);
        // Initial frame
        message.nextFrame();
        const decodedEntries = EntryListCodec.decode(message, StringCodec.decode, StringCodec.decode);
        expect(decodedEntries).to.deep.equal(entries);
        const nullEntry = EntryListCodec.decodeNullable(message, StringCodec.decode, StringCodec.decode);
        expect(nullEntry).to.be.null;
    });

    it('encode/decode number-Long entry list', function () {
        const entries = [[111, Long.fromNumber(-111)], [-222, Long.fromNumber(222)], [333, Long.fromNumber(-333)]];
        EntryListIntegerLongCodec.encode(message, entries);
        // Initial frame
        message.nextFrame();
        const decodedEntries = EntryListIntegerLongCodec.decode(message);
        expect(decodedEntries).to.deep.equal(entries);
    });

    it('encode/decode number-UUID entry list', function () {
        const uuid = new UUID(Long.fromNumber(0xCAFE), Long.fromNumber(0xBABE));
        const entries = [[1, uuid], [3, uuid], [5, uuid]];
        EntryListIntegerUUIDCodec.encode(message, entries);
        // Initial frame
        message.nextFrame();
        const decodedEntries = EntryListIntegerUUIDCodec.decode(message);
        expect(decodedEntries).to.deep.equal(entries);
    });

    it('encode/decode UUID-number array entry list', function () {
        const uuid = new UUID(Long.fromNumber(0xCAFE), Long.fromNumber(0xBABE));
        const entries = [[uuid, [1, 2]], [uuid, [3, 4]], [uuid, [5, 6]]];
        EntryListUUIDListIntegerCodec.encode(message, entries);
        // Initial frame
        message.nextFrame();
        const decodedEntries = EntryListUUIDListIntegerCodec.decode(message);
        expect(decodedEntries).to.deep.equal(entries);
    });

    it('encode/decode UUID-Long entry list', function () {
        const uuid = new UUID(Long.fromNumber(0xCAFE), Long.fromNumber(0xBABE));
        const entries = [[uuid, Long.fromNumber(1)], [uuid, Long.fromNumber(2)], [uuid, Long.fromNumber(3)]];
        EntryListUUIDLongCodec.encode(message, entries);
        // Initial frame
        message.nextFrame();
        const decodedEntries = EntryListUUIDLongCodec.decode(message);
        expect(decodedEntries).to.deep.equal(entries);
    });

    it('decode server errors', function () {
        const holder = new ErrorHolder(-12345, 'class', 'message', []);
        ListMultiFrameCodec.encode(message, [holder], ErrorHolderCodec.encode);
        const decodedErrors = ErrorsCodec.decode(message);
        expect(decodedErrors).to.deep.equal([holder]);
    });

    it('encode/decode number array', function () {
        const array = [0xCAFE, 0xBABE, -9999999];
        ListIntegerCodec.encode(message, array);
        // Initial frame
        message.nextFrame();
        const decodedArray = ListIntegerCodec.decode(message);
        expect(decodedArray).to.deep.equal(array);
    });

    it('encode/decode Long array', function () {
        const array = [Long.fromNumber(1), Long.fromNumber(-2), Long.fromNumber(555)];
        ListLongCodec.encode(message, array);
        // Initial frame
        message.nextFrame();
        const decodedArray = ListLongCodec.decode(message);
        expect(decodedArray).to.deep.equal(array);
    });

    it('encode/decode generic array', function () {
        const array = ['a', 'b', 'c'];
        ListMultiFrameCodec.encode(message, array, StringCodec.encode);
        // Initial frame
        message.nextFrame();
        const decodedArray = ListMultiFrameCodec.decode(message, StringCodec.decode);
        expect(decodedArray).to.deep.equal(array);
    });

    it('encode/decode UUID array', function () {
        const uuid = new UUID(Long.fromNumber(0xCAFE), Long.fromNumber(0xBABE));
        const array = [uuid, uuid, uuid];
        ListUUIDCodec.encode(message, array);
        // Initial frame
        message.nextFrame();
        const decodedArray = ListUUIDCodec.decode(message);
        expect(decodedArray).to.deep.equal(array);
    });

    it('encode/decode generic Map', function () {
        const map = new Map();
        map.set('a', 'b');
        map.set('c', 'd');
        map.set('e', 'f');
        MapCodec.encode(message, map, StringCodec.encode, StringCodec.encode);
        // Initial frame
        message.nextFrame();
        const decodedMap = MapCodec.decode(message, StringCodec.decode, StringCodec.decode);
        expect(decodedMap).to.deep.equal(map);
    });

    it('encode/decode string', function () {
        const str = 'abc©☺𩸽🐶😁';
        StringCodec.encode(message, str);
        // Initial frame
        message.nextFrame();
        const decodedString = StringCodec.decode(message);
        expect(decodedString).to.equal(str);
    });

    it('fastForwardToEndFrame ', function () {
        const holder = new ErrorHolder(-12345, 'class', 'message', []);
        ErrorHolderCodec.encode(message, holder); // Assuming a new error holder parameter is added to custom type
        message.addFrame(cm.END_FRAME.copy());
        CodecUtil.fastForwardToEndFrame(message);
        expect(message.peekNextFrame()).to.be.null;
    });

    it('encode/decode nullable', function () {
        CodecUtil.encodeNullable(message, 'a', StringCodec.encode);
        CodecUtil.encodeNullable(message, null, StringCodec.encode);
        // Initial frame
        message.nextFrame();
        const decodedString = CodecUtil.decodeNullable(message, StringCodec.decode);
        expect(decodedString).to.equal('a');
        expect(CodecUtil.decodeNullable(message, StringCodec.decode)).to.be.null;
    });

    it('nextFrameIsDataStructureEndFrame', function () {
        expect(CodecUtil.nextFrameIsDataStructureEndFrame(message)).to.be.false;
        message.addFrame(cm.END_FRAME.copy());
        // Initial frame
        message.nextFrame();
        expect(CodecUtil.nextFrameIsDataStructureEndFrame(message)).to.be.true;
    });

    it('nextFrameIsNullFrame', function () {
        expect(CodecUtil.nextFrameIsNullFrame(message)).to.be.false;
        message.addFrame(cm.NULL_FRAME.copy());
        // Initial frame
        message.nextFrame();
        expect(CodecUtil.nextFrameIsNullFrame(message)).to.be.true;
        expect(message.peekNextFrame()).to.be.null;
    });
});
