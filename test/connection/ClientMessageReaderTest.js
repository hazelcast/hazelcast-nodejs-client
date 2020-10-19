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

const { ClientMessageReader } = require('../../lib/network/ClientConnection');
const cm = require('../../lib/protocol/ClientMessage');
const headerSize = cm.SIZE_OF_FRAME_LENGTH_AND_FLAGS;

describe('ClientMessageReader', function () {

    let reader;

    beforeEach(function() {
        reader = new ClientMessageReader();
    });

    it('reads single message', function() {
        const buffer = prepareMessage(8);
        reader.append(buffer);

        expect(reader.read().startFrame.content).to.be.deep.equal(buffer.slice(headerSize));
    });

    it('reads multiple messages', function() {
        const buffer = Buffer.concat([prepareMessage(8), prepareMessage(8)]);
        reader.append(buffer);

        expect(reader.read().startFrame.content).to.be.deep.equal(buffer.slice(headerSize, headerSize + 8));
        expect(reader.read().startFrame.content).to.be.deep.equal(buffer.slice(2 * headerSize + 8));
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
        expect(reader.read().startFrame.content).to.be.deep.equal(buffer.slice(headerSize));
    });

    it('reads chunked message with small first chunk', function() {
        const buffer = prepareMessage(128);
        reader.append(buffer.slice(0, 2));

        expect(reader.read()).to.be.equal(null);

        reader.append(buffer.slice(2));
        expect(reader.read().startFrame.content).to.be.deep.equal(buffer.slice(headerSize));
    });

    it('returns slices for multiple messages in single chunk', function() {
        const buffer = Buffer.concat([prepareMessage(8), prepareMessage(8)]);
        reader.append(buffer);

        const read = reader.read();
        buffer.writeInt32LE(42, 4);

        expect(read.startFrame.content).to.be.deep.equal(buffer.slice(headerSize, headerSize + 8));
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

    const prepareMessage = (size) => {
        const buffer = Buffer.allocUnsafe(cm.SIZE_OF_FRAME_LENGTH_AND_FLAGS + size);
        buffer.writeInt32LE(buffer.length, 0);
        buffer.writeUInt16LE(1 << 15 | 1 << 14 | 1 << 13, 4);
        return buffer;
    };

});
