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

const { expect } = require('chai');

const {
    ClientMessage,
    Frame,
    BEGIN_FRAME,
    END_FRAME,
    SIZE_OF_FRAME_LENGTH_AND_FLAGS
} = require('../../../lib/protocol/ClientMessage');
const { CodecUtil } = require('../../../lib/codec/builtin/CodecUtil');

describe('ClientMessageTest', function () {

    const IS_FINAL_FLAG = 1 << 13;
    const INT_SIZE_IN_BYTES = 4;

    function createFrameLengthAndFlagsBuffer(frame, isLastFrame) {
        const frameLengthAndFlags = Buffer.allocUnsafe(SIZE_OF_FRAME_LENGTH_AND_FLAGS);
        frameLengthAndFlags.writeInt32LE(frame.content.length + SIZE_OF_FRAME_LENGTH_AND_FLAGS, 0);
        if (isLastFrame) {
            frameLengthAndFlags.writeUInt16LE(frame.flags | IS_FINAL_FLAG, INT_SIZE_IN_BYTES);
        } else {
            frameLengthAndFlags.writeUInt16LE(frame.flags, INT_SIZE_IN_BYTES);
        }
        return frameLengthAndFlags;
    }

    it('should restore message when encoded and decoded', function () {
        const cmEncode = ClientMessage.createForEncode();

        cmEncode.addFrame(Frame.createInitialFrame(50));
        cmEncode.setMessageType(1);
        cmEncode.setCorrelationId(1234567812345678);
        cmEncode.setPartitionId(11223344);

        const cmDecode = ClientMessage.createForDecode(cmEncode.startFrame);

        expect(cmEncode.getMessageType()).to.equal(cmDecode.getMessageType());
        expect(cmEncode.getStartFrame().flags).to.equal(cmDecode.getStartFrame().flags);
        expect(cmEncode.getCorrelationId()).to.equal(cmDecode.getCorrelationId());
        expect(cmEncode.getPartitionId()).to.equal(cmDecode.getPartitionId());
        expect(cmEncode.getTotalLength()).to.equal(cmDecode.getTotalLength());
    });

    it('copyWithNewCorrelationId: should assign new correlation id and share the non-header frames', function () {
        const originalMessage = ClientMessage.createForEncode();

        originalMessage.addFrame(Frame.createInitialFrame(50));
        originalMessage.setMessageType(1);
        originalMessage.setCorrelationId(1234567812345678);
        originalMessage.setPartitionId(11223344);
        originalMessage.setRetryable(true);
        originalMessage.addFrame(Frame.createInitialFrame(20));

        const copyMessage = originalMessage.copyWithNewCorrelationId();

        // get the frame after the start frame for comparison
        originalMessage.nextFrame();
        copyMessage.nextFrame();

        const originalFrame = originalMessage.nextFrame();
        const copyFrame = copyMessage.nextFrame();

        expect(originalFrame.content).to.equal(copyFrame.content);
        expect(originalFrame.flags).to.equal(copyFrame.flags);

        expect(originalMessage.getMessageType()).to.equal(copyMessage.getMessageType());
        expect(originalMessage.getStartFrame().flags).to.equal(copyMessage.getStartFrame().flags);
        expect(originalMessage.getPartitionId()).to.equal(copyMessage.getPartitionId());
        expect(originalMessage.getTotalLength()).to.equal(copyMessage.getTotalLength());
        expect(copyMessage.getCorrelationId()).to.equal(-1);
    });

    it('should be fast forwardable when extended', function () {
        const clientMessage = ClientMessage.createForEncode();

        clientMessage.addFrame(BEGIN_FRAME.copy());

        // New custom-typed parameter with its own begin and end frames
        clientMessage.addFrame(BEGIN_FRAME.copy());
        clientMessage.addFrame(new Frame(Buffer.allocUnsafe(0)));
        clientMessage.addFrame(END_FRAME.copy());

        clientMessage.addFrame(END_FRAME.copy());

        // begin frame
        clientMessage.nextFrame();
        CodecUtil.fastForwardToEndFrame(clientMessage);

        expect(clientMessage.hasNextFrame()).to.be.false;
    });

    it('getTotalLength: should calculate total length correctly', function () {
        const clientMessage = ClientMessage.createForEncode();
        expect(clientMessage.getTotalLength()).to.be.equal(0);

        clientMessage.addFrame(Frame.createInitialFrame(42));
        expect(clientMessage.getTotalLength()).to.be.equal(SIZE_OF_FRAME_LENGTH_AND_FLAGS + 42);

        clientMessage.addFrame(Frame.createInitialFrame(1));
        expect(clientMessage.getTotalLength()).to.be.equal(2 * SIZE_OF_FRAME_LENGTH_AND_FLAGS + 43);
    });

    it('writeTo: should write to given buffer of sufficient length', function () {
        const clientMessage = ClientMessage.createForEncode();

        const frame1 = Frame.createInitialFrame(16);
        clientMessage.addFrame(frame1);
        clientMessage.setMessageType(1);
        clientMessage.setCorrelationId(123);
        clientMessage.setPartitionId(11223344);

        const frame2 = new Frame(Buffer.from('foo', 'utf8'));
        clientMessage.addFrame(frame2);

        const buffer = Buffer.allocUnsafe(42 + clientMessage.getTotalLength());
        const newPos = clientMessage.writeTo(buffer, 42);

        expect(newPos).to.be.equal(42 + clientMessage.getTotalLength());

        const expected = Buffer.concat([
            createFrameLengthAndFlagsBuffer(frame1, false),
            frame1.content,
            createFrameLengthAndFlagsBuffer(frame2, true),
            frame2.content
        ]);
        const actual = buffer.slice(42, 42 + clientMessage.getTotalLength());

        expect(Buffer.compare(actual, expected)).to.be.equal(0);
    });

    it('toBuffer: should return buffer with message contents', function () {
        const clientMessage = ClientMessage.createForEncode();

        const frame = Frame.createInitialFrame(16);
        clientMessage.addFrame(frame);
        clientMessage.setMessageType(1);
        clientMessage.setCorrelationId(123);
        clientMessage.setPartitionId(11223344);

        const actual = clientMessage.toBuffer();
        const expected = Buffer.concat([
            createFrameLengthAndFlagsBuffer(frame, true),
            frame.content
        ]);

        expect(Buffer.compare(actual, expected)).to.be.equal(0);
    });
});
