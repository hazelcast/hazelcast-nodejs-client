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

'use strict';

const expect = require('chai').expect;
const crypto = require('crypto');

const {
    ClientMessageReader,
    FragmentedClientMessageHandler
} = require('../../lib/network/ClientConnection');
const cm = require('../../lib/protocol/ClientMessage');
const { FixSizedTypesCodec } = require('../../lib/codec/builtin/FixSizedTypesCodec');

describe('FragmentedClientMessageHandlerTest', function () {

    let reader;
    let handler;

    beforeEach(() => {
        reader = new ClientMessageReader();
        handler = new FragmentedClientMessageHandler({
            debug: () => {}
        });
    });

    it('handles fragmented message', function (done) {
        const message = createMessage(10, 9);
        const fragments = split(48, message, 42);

        expect(fragments).to.have.lengthOf(3);
        reader.append(writeFragments(fragments));

        const fragment0 = reader.read();
        const fragment1 = reader.read();
        const fragment2 = reader.read();

        expect(fragment0.startFrame.hasBeginFragmentFlag()).to.be.true;
        expect(fragment0.startFrame.hasEndFragmentFlag()).to.be.false;

        expect(fragment1.startFrame.hasBeginFragmentFlag()).to.be.false;
        expect(fragment1.startFrame.hasEndFragmentFlag()).to.be.false;

        expect(fragment2.startFrame.hasBeginFragmentFlag()).to.be.false;
        expect(fragment2.startFrame.hasEndFragmentFlag()).to.be.true;

        // Should add to map
        handler.handleFragmentedMessage(fragment0, () => done(new Error("It should just add to map.")));
        const fragmentedMessage = handler.fragmentedMessages.get(42);
        compareMessages(fragments[0].startFrame.next, fragmentedMessage.startFrame);
        let endFrame = fragmentedMessage.endFrame;

        // Should merge with the above message
        handler.handleFragmentedMessage(fragment1, () => done(new Error("It should just merge.")));
        expect(handler.fragmentedMessages.size).to.equal(1);
        compareMessages(fragments[1].startFrame.next, endFrame.next);
        endFrame = fragmentedMessage.endFrame;

        // Should merge with the above message and run the callback
        let isCalled = false;
        handler.handleFragmentedMessage(fragment2, () => {
            compareMessages(fragments[2].startFrame.next, endFrame.next);
            isCalled = true;
        });
        expect(isCalled).to.be.true;
        expect(handler.fragmentedMessages.size).to.equal(0);

        // If a message with a missing begin part is received, we should do nothing
        handler.handleFragmentedMessage(fragment1, () => done(new Error("It should ignore invalid messages.")))
        handler.handleFragmentedMessage(fragment2, () => done(new Error("It should ignore invalid messages.")))
        expect(handler.fragmentedMessages.size).to.equal(0);

        done();
    });

    const compareMessages = (frame1, frame2) => {
        expect(frame1).to.not.be.null;
        while (frame1 != null) {
            expect(frame1.content).to.deep.equal(frame2.content);

            frame1 = frame1.next;
            frame2 = frame2.next;
        }
        expect(frame2).to.be.null;
    };

    const writeFragments = (fragments) => {
        const buffers = [];
        let totalLength = 0;
        for (let i = 0; i < fragments.length; i++) {
            const fragment = fragments[i];
            const buffer = fragment.toBuffer();
            buffers.push(buffer);
            totalLength += buffer.length;
        }
        return Buffer.concat(buffers, totalLength);
    };

    const createMessage = (frameLength, frameCount) => {
        const message = cm.ClientMessage.createForEncode();
        for (let i = 0; i < frameCount; i++) {
            message.addFrame(new cm.Frame(crypto.randomBytes(frameLength)));
        }
        return message;
    };

    const readState = {
        BEGINNING: 0,
        MIDDLE: 1,
    };

    const split = (maxTotalFrameLength, clientMessage, fragmentId) => {
        const fragments = [];

        let length = 0;
        let fragment = null;
        let state = readState.BEGINNING;

        while (clientMessage.hasNextFrame()) {
            const frame = clientMessage.peekNextFrame();
            const frameLength = frame.getLength();
            length += frameLength;

            if (frameLength > maxTotalFrameLength) {
                clientMessage.nextFrame();
                if (state === readState.MIDDLE) {
                    fragments.push(fragment);
                }
                fragment = createFragment(fragmentId);
                fragment.addFrame(frame.copy());
                fragments.push(fragment);
                state = readState.BEGINNING;
                length = 0;
            } else if (length <= maxTotalFrameLength) {
                clientMessage.nextFrame();
                if (state === readState.BEGINNING) {
                    fragment = createFragment(fragmentId);
                }
                fragment.addFrame(frame.copy());
                state = readState.MIDDLE;
            } else {
                fragments.push(fragment);
                state = readState.BEGINNING;
                length = 0;
            }
        }
        if (state === readState.MIDDLE) {
            fragments.push(fragment);
        }

        fragments[0].startFrame.flags |= 1 << 15;
        fragments[fragments.length - 1].startFrame.flags |= 1 << 14;
        return fragments;
    }

    const createFragment = (fragmentId) => {
        const fragment = cm.ClientMessage.createForEncode();
        const frame = new cm.Frame(Buffer.allocUnsafe(8));
        FixSizedTypesCodec.encodeLong(frame.content, 0, fragmentId);
        fragment.addFrame(frame);
        return fragment;
    }

});
