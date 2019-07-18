/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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

const Buffer = require('safe-buffer').Buffer;
const expect = require('chai').expect;

const FrameReader = require('../../lib/invocation/ClientConnection').FrameReader;

describe('FrameReader', function () {

    let reader;

    beforeEach(() => {
        reader = new FrameReader;
    });

    it('reads single message (without copying it)', () => {
        const buffer = prepareMessage(8);
        reader.append(buffer);

        expect(reader.read()).to.be.equal(buffer);
    });

    it('reads multiple messages', () => {
        const buffer = Buffer.concat([prepareMessage(8), prepareMessage(8)]);
        reader.append(buffer);

        expect(reader.read()).to.be.deep.equal(buffer.slice(0, 8));
        expect(reader.read()).to.be.deep.equal(buffer.slice(8));
    });

    it('reads chunked message', () => {
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
        expect(reader.read()).to.be.deep.equal(Buffer.from(buffer));
    });

    it('reads chunked message with small first chunk', () => {
        const buffer = prepareMessage(128);
        reader.append(buffer.slice(0, 2));

        expect(reader.read()).to.be.equal(null);
        
        reader.append(buffer.slice(2));
        expect(reader.read()).to.be.deep.equal(Buffer.from(buffer));
    });

    it('returns slices for multiple messages in single chunk', () => {
        const buffer = Buffer.concat([prepareMessage(8), prepareMessage(8)]);
        reader.append(buffer);

        const read = reader.read();
        buffer.writeInt32LE(42, 4);

        expect(read).to.be.deep.equal(buffer.slice(0, 8));
    });

    it('returns null on read initially', () => {
        expect(reader.read()).to.be.equal(null);
    });

    it('returns null on read when all messages are read', () => {
        const buffer = prepareMessage(8);
        reader.append(buffer);
        reader.read();
        
        expect(reader.read()).to.be.equal(null);
    });

    const prepareMessage = (size) => {
        const buffer = Buffer.allocUnsafe(size);
        buffer.writeInt32LE(size);
        return buffer;
    }

});
