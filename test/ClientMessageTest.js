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


var ClientMessage = require("../lib/ClientMessage");
var expect = require('chai').expect;
var Buffer = require('safe-buffer').Buffer;
var Long = require('long');

describe('ClientMessageTest', function () {

    var message;
    var buffer;

    beforeEach(function () {
        buffer = Buffer.alloc(20);
        message = new ClientMessage(buffer);
        message.cursor = 0;
    });

    it('should append byte', function () {
        message.appendByte(0x3);
        expect(message.cursor).to.equal(1);
        expect(buffer[0]).to.equal(0x3);
    });

    it('should append boolean', function () {
        message.appendBoolean(true);
        expect(message.cursor).to.equal(1);
        expect(buffer[0]).to.equal(0x1);
    });

    it('should append int32', function () {
        message.appendInt32(0x1234);
        expect(message.cursor).to.equal(4);
        expect(buffer[0]).to.equal(0x34);
        expect(buffer[1]).to.equal(0x12);
    });

    it('should append uint8', function () {
        message.appendUint8(0xAF);
        expect(message.cursor).to.equal(1);
        expect(buffer[0]).to.equal(0xAF);
    });

    it('should append long', function () {
        message.appendLong(0x12345678);
        expect(message.cursor).to.equal(8);
        expect(buffer[0]).to.equal(0x78);
        expect(buffer[1]).to.equal(0x56);
        expect(buffer[2]).to.equal(0x34);
        expect(buffer[3]).to.equal(0x12);
    });

    it('should append utf8 string', function () {
        //0x61 0x62 0x63 0xC2 0xA9 0xE2 0x98 0xBA 0xF0 0xA9 0xB8 0xBD
        message.appendString('abc©☺𩸽');
        expect(message.cursor).to.equal(16);
        expect(buffer[0]).to.equal(0x0C);
        expect(buffer[1]).to.equal(0x00);
        expect(buffer[2]).to.equal(0x00);
        expect(buffer[3]).to.equal(0x00);
        expect(buffer[4]).to.equal(0x61);
        expect(buffer[5]).to.equal(0x62);
        expect(buffer[6]).to.equal(0x63);
        expect(buffer[7]).to.equal(0xC2);
        expect(buffer[8]).to.equal(0xA9);
        expect(buffer[9]).to.equal(0xE2);
        expect(buffer[10]).to.equal(0x98);
        expect(buffer[11]).to.equal(0xBA);
        expect(buffer[12]).to.equal(0xF0);
        expect(buffer[13]).to.equal(0xA9);
        expect(buffer[14]).to.equal(0xB8);
        expect(buffer[15]).to.equal(0xBD);
    });

    it('should append buffer', function () {
        message.appendBuffer(Buffer.from('abc©☺𩸽'));
        expect(message.cursor).to.equal(16);
        expect(buffer[0]).to.equal(0x0C);
        expect(buffer[1]).to.equal(0x00);
        expect(buffer[2]).to.equal(0x00);
        expect(buffer[3]).to.equal(0x00);
        expect(buffer[4]).to.equal(0x61);
        expect(buffer[5]).to.equal(0x62);
        expect(buffer[6]).to.equal(0x63);
        expect(buffer[7]).to.equal(0xC2);
        expect(buffer[8]).to.equal(0xA9);
        expect(buffer[9]).to.equal(0xE2);
        expect(buffer[10]).to.equal(0x98);
        expect(buffer[11]).to.equal(0xBA);
        expect(buffer[12]).to.equal(0xF0);
        expect(buffer[13]).to.equal(0xA9);
        expect(buffer[14]).to.equal(0xB8);
        expect(buffer[15]).to.equal(0xBD);
    });

    it('should read byte', function () {
        message.appendByte(0x3);
        message.cursor = 0;
        expect(message.readByte()).to.equal(0x3);
    });

    it('should read boolean', function () {
        message.appendBoolean(true);
        message.cursor = 0;
        expect(message.readBoolean()).to.be.true;
    });

    it('should read int32', function () {
        message.appendInt32(0x1234);
        message.cursor = 0;
        expect(message.readInt32()).to.equal(0x1234);
    });

    it('should read uint8', function () {
        message.appendUint8(0xAF);
        message.cursor = 0;
        expect(message.readUInt8()).to.equal(0xAF);
    });

    it('should read long', function () {
        message.appendLong(0x12345678);
        message.cursor = 0;
        expect(message.readLong()).to.deep.equal(Long.fromValue(0x12345678));
    });

    it('should read utf8 string', function () {
        message.appendString('abc©☺𩸽');
        message.cursor = 0;
        expect(message.readString()).to.equal('abc©☺𩸽');
    });

    it('should read buffer', function () {
        message.appendBuffer(Buffer.from('abc©☺𩸽'));
        message.cursor = 0;
        expect(message.readBuffer()).to.deep.equal(Buffer.from('abc©☺𩸽'));
    });
});
