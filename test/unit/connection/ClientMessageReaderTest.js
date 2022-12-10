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

'use strict';

const { expect } = require('chai');

const { ClientMessageReader } = require('../../../lib/network/Connection');
const cm = require('../../../lib/protocol/ClientMessage');
const {Frame, ClientMessage} = require('../../../lib/protocol/ClientMessage');

describe('OldClientMessageReaderTest', function () {
    const HEADER_SIZE = cm.SIZE_OF_FRAME_LENGTH_AND_FLAGS;

    let reader;

    function prepareMessage(size) {
        const buffer = Buffer.allocUnsafe(cm.SIZE_OF_FRAME_LENGTH_AND_FLAGS + size);
        buffer.writeInt32LE(buffer.length, 0);
        buffer.writeUInt16LE(1 << 15 | 1 << 14 | 1 << 13, 4);
        return buffer;
    }

    beforeEach(function() {
        reader = new ClientMessageReader();
    });

    it('reads single message', function() {
        const buffer = prepareMessage(8);
        reader.append(buffer);

        expect(reader.read().startFrame.content).to.be.deep.equal(buffer.slice(HEADER_SIZE));
    });

    it('reads multiple messages', function() {
        const buffer = Buffer.concat([prepareMessage(8), prepareMessage(8)]);
        reader.append(buffer);

        expect(reader.read().startFrame.content).to.be.deep.equal(buffer.slice(HEADER_SIZE, HEADER_SIZE + 8));
        expect(reader.read().startFrame.content).to.be.deep.equal(buffer.slice(2 * HEADER_SIZE + 8));
    });

    it('reads chunked message', function() {
        const chunkSize = 64;
        const chunkCnt = 4;
        const buffer = prepareMessage(chunkSize * chunkCnt);
        let pos = 0;
        for (let i = 0; i < chunkCnt - 1; i++) {
            reader.append(buffer.slice(pos, pos + chunkSize));
            pos += chunkSize;
            expect(reader.read()).to.be.equal(null);
        }

        reader.append(buffer.slice(pos));
        expect(reader.read().startFrame.content).to.be.deep.equal(buffer.slice(HEADER_SIZE));
    });

    it('reads chunked message with small first chunk', function() {
        const buffer = prepareMessage(128);
        reader.append(buffer.slice(0, 2));

        expect(reader.read()).to.be.equal(null);

        reader.append(buffer.slice(2));
        expect(reader.read().startFrame.content).to.be.deep.equal(buffer.slice(HEADER_SIZE));
    });

    it('returns slices for multiple messages in single chunk', function() {
        const buffer = Buffer.concat([prepareMessage(8), prepareMessage(8)]);
        reader.append(buffer);

        const read = reader.read();
        buffer.writeInt32LE(42, 4);

        expect(read.startFrame.content).to.be.deep.equal(buffer.slice(HEADER_SIZE, HEADER_SIZE + 8));
    });

    it('returns null on read initially', function() {
        expect(reader.read()).to.be.equal(null);
    });

    it('returns null on read when all messages are read', function() {
        const buffer = prepareMessage(8);
        reader.append(buffer);
        reader.read();

        expect(reader.read()).to.be.equal(null);
    });
});

describe('ClientMessageReaderTest', function () {
    function createFrameWithRandomBytes(length) {
        const buffer = Buffer.allocUnsafe(length);
        for (let i = 0; i < length; i++) {
            buffer.writeUInt8(Math.floor(Math.random() * 256), i);
        }
        return new Frame(buffer);
    }

    function writeToBuffer(message) {
        const buffer = Buffer.allocUnsafe(message.getTotalLength());
        message.writeTo(buffer);
        return buffer;
    }

    let reader;

    beforeEach(function() {
        reader = new ClientMessageReader();
    });

    it('testReadSingleFrameMessage', function() {
        const frame = createFrameWithRandomBytes(42);
        const message = ClientMessage.createForEncode();
        message.addFrame(frame);
        const buffer = writeToBuffer(message);
        reader.append(buffer);

        const messageRead = reader.read();
        expect(messageRead).to.be.not.equal(null);
        expect(messageRead.hasNextFrame()).to.be.true;

        const frameRead = messageRead.nextFrame();
        expect(frameRead.content).to.deep.equal(frame.content);

        expect(messageRead.hasNextFrame()).to.be.false;
    });

    it('testReadMultiFrameMessage', function() {
        const frame1 = createFrameWithRandomBytes(10);
        const frame2 = createFrameWithRandomBytes(20);
        const frame3 = createFrameWithRandomBytes(30);

        const message = ClientMessage.createForEncode();
        message.addFrame(frame1);
        message.addFrame(frame2);
        message.addFrame(frame3);

        const buffer = writeToBuffer(message);
        reader.append(buffer);

        const messageRead = reader.read();
        expect(messageRead).to.be.not.equal(null);
        let frameRead = messageRead.nextFrame();
        expect(frameRead.content).to.deep.equal(frame1.content);

        expect(messageRead.hasNextFrame()).to.be.true;
        frameRead = messageRead.nextFrame();
        expect(frameRead.content).to.deep.equal(frame2.content);

        expect(messageRead.hasNextFrame()).to.be.true;
        frameRead = messageRead.nextFrame();
        expect(frameRead.content).to.deep.equal(frame3.content);

        expect(messageRead.hasNextFrame()).to.be.false;
    });

    it('testReadFramesInMultipleCallsToReadFrom', function() {
        const frame = createFrameWithRandomBytes(1000);

        const message = ClientMessage.createForEncode();
        message.addFrame(frame);

        const buffer = writeToBuffer(message);

        const firstPartition = buffer.slice(0, 750);
        const secondPartition = buffer.slice(750);

        reader.append(firstPartition);
        expect(reader.read()).to.be.null;
        reader.append(secondPartition);

        const messageRead = reader.read();
        expect(messageRead).to.be.not.null;
        expect(messageRead.hasNextFrame()).to.be.true;

        const frameRead = messageRead.nextFrame();
        expect(frameRead.content).to.deep.equal(frame.content);

        expect(messageRead.hasNextFrame()).to.be.false;
    });

    it('testReadFramesInMultipleCallsToReadFrom_whenLastPieceIsSmall', function() {
        const frame = createFrameWithRandomBytes(1000);

        const message = ClientMessage.createForEncode();
        message.addFrame(frame);

        const buffer = writeToBuffer(message);

        const firstPartition = buffer.slice(0, 750);
        const secondPartition = buffer.slice(750, 1002);

        // Message Length = 1000 + 6 bytes
        // part1 = 750, part2 = 252, part3 = 4 bytes
        const thirdPartition = buffer.slice(1002);

        reader.append(firstPartition);
        expect(reader.read()).to.be.null;
        reader.append(secondPartition);
        expect(reader.read()).to.be.null;
        reader.append(thirdPartition);

        const messageRead = reader.read();
        expect(messageRead).not.to.be.null;
        expect(messageRead.hasNextFrame()).to.be.true;

        const frameRead = messageRead.nextFrame();
        expect(frameRead.content).to.deep.equal(frame.content);

        expect(messageRead.hasNextFrame()).to.be.false;
    });

    it('testRead_whenTheFrameLengthAndFlagsNotReceivedAtFirst', function() {
        const frame = createFrameWithRandomBytes(100);

        const message = ClientMessage.createForEncode();
        message.addFrame(frame);

        const buffer = writeToBuffer(message);

        // Set limit to a small value so that we can simulate
        // that the frame length and flags are not read yet.
        const firstPartition = buffer.slice(0, 4);
        reader.append(firstPartition);
        let messageRead = reader.read();

        // should not be able to read with just 4 bytes of data
        expect(messageRead).to.be.null;
        const secondPartition = buffer.slice(4, buffer.length);
        reader.append(secondPartition);

        messageRead = reader.read();
        // should be able to read when the rest of the data comes
        expect(messageRead).to.be.not.equal(null);
        expect(messageRead.hasNextFrame()).to.be.true;

        const frameRead = messageRead.nextFrame();
        expect(frameRead.content).to.deep.equal(frame.content);

        expect(messageRead.hasNextFrame()).to.be.false;
    });
});
