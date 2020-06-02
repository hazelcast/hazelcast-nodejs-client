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

const cm = require('../../../lib/ClientMessage');
const expect = require('chai').expect;
const Buffer = require('safe-buffer').Buffer;
const Long = require('long');
const CodecUtil = require('../../../lib/codec/builtin/CodecUtil').CodecUtil;

const ClientMessage = cm.ClientMessage;
const Frame = cm.Frame;
const DEFAULT_FLAGS = cm.DEFAULT_FLAGS;
const IS_FINAL_FLAG = cm.IS_FINAL_FLAG;
const BEGIN_FRAME = cm.BEGIN_FRAME;
const END_FRAME = cm.END_FRAME;


describe('ClientMessage', function () {
    it('should be encoded and decoded', function () {
        const cmEncode = ClientMessage.createForEncode();

        cmEncode.addFrame(new Frame(Buffer.allocUnsafe(50), DEFAULT_FLAGS));
        cmEncode.setMessageType(1);
        cmEncode.setCorrelationId(Long.fromString('1234567812345678'));
        cmEncode.setPartitionId(11223344);

        const cmDecode = ClientMessage.createForDecode(cmEncode.startFrame);

        expect(cmEncode.getMessageType()).to.equal(cmDecode.getMessageType());
        expect(cmEncode.getHeaderFlags()).to.equal(cmDecode.getHeaderFlags());
        expect(cmEncode.getCorrelationId()).to.equal(cmDecode.getCorrelationId());
        expect(cmEncode.getPartitionId()).to.equal(cmDecode.getPartitionId());
        expect(cmEncode.getTotalFrameLength()).to.equal(cmDecode.getTotalFrameLength());
        expect(cmEncode.getNumberOfBackupAcks()).to.equal(cmDecode.getNumberOfBackupAcks());
    });

    it('should be copied with new correlation id and share the non-header frames', function () {
        const originalMessage = ClientMessage.createForEncode();

        originalMessage.addFrame(new Frame(Buffer.allocUnsafe(50), DEFAULT_FLAGS));
        originalMessage.setMessageType(1);
        originalMessage.setCorrelationId(Long.fromString('1234567812345678'));
        originalMessage.setPartitionId(11223344);
        originalMessage.setRetryable(true);
        originalMessage.addFrame(new Frame(Buffer.allocUnsafe(20), IS_FINAL_FLAG));

        const copyMessage = originalMessage.copyWithNewCorrelationId();

        // get the frame after the start frame for comparison
        originalMessage.nextFrame();
        copyMessage.nextFrame();

        const originalFrame = originalMessage.nextFrame();
        const copyFrame = copyMessage.nextFrame();

        expect(originalFrame.content).to.equal(copyFrame.content);
        expect(originalFrame.flags).to.equal(copyFrame.flags);

        expect(originalMessage.getMessageType()).to.equal(copyMessage.getMessageType());
        expect(originalMessage.getHeaderFlags()).to.equal(copyMessage.getHeaderFlags());
        expect(originalMessage.getPartitionId()).to.equal(copyMessage.getPartitionId());
        expect(originalMessage.getTotalFrameLength()).to.equal(copyMessage.getTotalFrameLength());
        expect(originalMessage.getNumberOfBackupAcks()).to.equal(copyMessage.getNumberOfBackupAcks());
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
});
