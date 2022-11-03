'use strict';

const { expect } = require('chai');

const { ClientMessageReader } = require('../../../lib/network/Connection');
const cm = require('../../../lib/protocol/ClientMessage');
const {ClientMessage} = require("../../../lib/protocol/ClientMessage");

describe('ClientMessageReaderTest', function () {

    const HEADER_SIZE = cm.SIZE_OF_FRAME_LENGTH_AND_FLAGS;

    function createFrameWithRandomBytes(length) {
        const frame = Buffer.allocUnsafe(length);
        for (let i = 0; i < length; i++) {
            frame.writeInt8(Math.floor(Math.random()), i);
        }
        return frame;
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

        expect(reader.readFromReader(buffer)).to.be.true;
    });
});
