'use strict';

const { expect } = require('chai');

const { ClientMessageReader } = require('../../../lib/network/Connection');
const cm = require('../../../lib/protocol/ClientMessage');
const {ClientMessage, Frame} = require("../../../lib/protocol/ClientMessage");

describe('ClientMessageReaderTest', function () {

    const HEADER_SIZE = cm.SIZE_OF_FRAME_LENGTH_AND_FLAGS;

    function createFrameWithRandomBytes(length) {
        const buffer = Buffer.allocUnsafe(length);
        for (let i = 0; i < length; i++) {
            buffer.writeInt8(Math.floor(Math.random()), i);
        }
        return new Frame(buffer);
    }

    function writeToBuffer(message) {
        const length = message.getTotalLength() + HEADER_SIZE;
        const buffer = Buffer.allocUnsafe(length);
        message.writeTo(buffer);
        return buffer;
    }

    let reader;
    beforeEach(function() {
        reader = new ClientMessageReader();
    });

    it('reads single message', function() {
        const frame = createFrameWithRandomBytes(42);
        const message = ClientMessage.createForEncode(0, 0, 0);
        message.addFrame(frame);
        const buffer = writeToBuffer(message);
        reader.append(buffer);

        const messageRead = reader.read();
        expect(messageRead.hasNextFrame()).to.be.true;

        const frameRead = messageRead.nextFrame();
        expect(frameRead.content).to.deep.equal(frame.content);

        expect(messageRead.hasNextFrame()).to.be.false;
    });

    it('reads multiple messages', function() {
        const frame1 = createFrameWithRandomBytes(10);
        const frame2 = createFrameWithRandomBytes(20);
        const frame3 = createFrameWithRandomBytes(30);

        const message = ClientMessage.createForEncode(0, 0, 0);
        message.addFrame(frame1);
        message.addFrame(frame2);
        message.addFrame(frame3);

        const buffer = writeToBuffer(message);
        reader.append(buffer);

        const messageRead = reader.read();
        expect(messageRead.hasNextFrame()).to.be.true;
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

    it('reads frames in multiple calls', function() {
        const frame = createFrameWithRandomBytes(1000);

        const message = ClientMessage.createForEncode(0, 0, 0);
        message.addFrame(frame);

        const buffer = writeToBuffer(message);

        const firstPartition = buffer.slice(0, 750);
        const secondPartition = buffer.slice(750);

        reader.append(firstPartition);
        reader.append(secondPartition);

        const messageRead = reader.read();
        expect(messageRead.hasNextFrame()).to.be.true;

        const frameRead = messageRead.nextFrame();
        expect(frameRead.content).to.deep.equal(frame.content);

        expect(messageRead.hasNextFrame()).to.be.false;
    });

    it('reads frames in multiple calls when last piece is small', function() {
        const frame = createFrameWithRandomBytes(1000);

        const message = ClientMessage.createForEncode(0, 0, 0);
        message.addFrame(frame);

        const buffer = writeToBuffer(message);

        const firstPartition = buffer.slice(0, 750);
        const secondPartition = buffer.slice(750, 1002);
        const thirdPartition = buffer.slice(1002);

        reader.append(firstPartition);
        reader.append(secondPartition);
        reader.append(thirdPartition);

        const messageRead = reader.read();
        expect(messageRead.hasNextFrame()).to.be.true;

        const frameRead = messageRead.nextFrame();
        expect(frameRead.content).to.deep.equal(frame.content);

        expect(messageRead.hasNextFrame()).to.be.false;
    });

    it('reads when the Frame length and Flags not received at first', function() {
        const frame = createFrameWithRandomBytes(100);

        const message = ClientMessage.createForEncode(0, 0, 0);
        message.addFrame(frame);

        const buffer = writeToBuffer(message);
        const capacity = buffer.length;
        let limit = 4;

        const firstPartition = buffer.slice(0, limit);

        reader.append(firstPartition);

        let messageRead = reader.read();
        expect(messageRead).to.be.null;

        limit = capacity;
        const secondPartition = buffer.slice(4, limit);
        reader.append(secondPartition);

        messageRead = reader.read();
        expect(messageRead.hasNextFrame()).to.be.true;

        const frameRead = messageRead.nextFrame();
        expect(frameRead.content).to.deep.equal(frame.content);

        expect(messageRead.hasNextFrame()).to.be.false;
    });
});
