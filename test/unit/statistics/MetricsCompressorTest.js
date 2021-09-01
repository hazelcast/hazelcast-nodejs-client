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

const { expect } = require('chai');
const fs = require('fs');
const zlib = require('zlib');

const {
    MetricsCompressor,
    MetricsDictionary,
    OutputBuffer,
    ProbeUnit
} = require('../../../lib/statistics/MetricsCompressor');
const { BitsUtil } = require('../../../lib/util/BitsUtil');

describe('MetricsCompressorTest', function () {
    const HEADER_SIZE = 6;
    const INT_SIZE = 4;

    let expectedBinary;

    async function decompressBuffer(buf) {
        return new Promise((resolve, reject) => {
            zlib.inflate(
                buf,
                (err, decompressedBuf) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(decompressedBuf);
                }
            );
        });
    }

    /**
     * Decompresses data from MetricsCompressor and returns a Buffer
     * containing raw payload. This approach mitigates differences
     * in zlib version and settings between Node.js and Java which
     * may lead to different compressed output.
     *
     * Structure of the returned buffer:
     * - Header (6 bytes): version, dictionary length - zeroed
     * - Decompressed dictionary binary (var length)
     * - Metrics count (4 bytes)
     * - Decompressed metrics binary (var length)
     *
     * @param {Buffer} binary compressor output
     */
    async function extractPayload(binary) {
        expect(binary.length).to.be.greaterThan(HEADER_SIZE);

        let pos = 0;

        // Header:
        // make a copy as we're going to mutate the header
        const header = Buffer.from(binary.slice(pos, pos + HEADER_SIZE));
        const dictionaryLenPos = pos + HEADER_SIZE - INT_SIZE;
        const dictionaryBufLen = BitsUtil.readInt32(header, dictionaryLenPos, true);
        // zero dictionary length as it depends on compression
        BitsUtil.writeInt32(header, dictionaryLenPos, 0, true);

        // Decompressed dictionary binary:
        pos += HEADER_SIZE;
        let dictionaryBuf = binary.slice(pos, pos + dictionaryBufLen);
        dictionaryBuf = await decompressBuffer(dictionaryBuf);

        // Metrics count:
        pos += dictionaryBufLen;
        const metricsLenBuf = binary.slice(pos, pos + INT_SIZE);

        // Decompressed metrics binary:
        pos += INT_SIZE;
        let metricsBuf = binary.slice(pos);
        metricsBuf = await decompressBuffer(metricsBuf);

        return Buffer.concat([ header, dictionaryBuf, metricsLenBuf, metricsBuf ]);
    }

    before(function () {
        expectedBinary = fs.readFileSync(__dirname + '/metrics.compatibility.binary');
    });

    it('should generate binary with the same payload as compressor in Java', async function () {
        const compressor = new MetricsCompressor();

        compressor.addLong({
            prefix: 'prefix',
            metric: 'deltaMetric1',
            discriminator: 'ds',
            discriminatorValue: 'dsName1',
            unit: ProbeUnit.COUNT
        }, 42);
        compressor.addDouble({
            prefix: 'prefix',
            metric: 'deltaMetric2',
            discriminator: 'ds',
            discriminatorValue: 'dsName1',
            unit: ProbeUnit.COUNT
        }, -4.2);
        compressor.addLong({
            prefix: 'a'.repeat(254),
            metric: 'longPrefixMetric',
            unit: ProbeUnit.BYTES
        }, 2147483647);

        const actualBinary = await compressor.generateBlob();

        const actualPayload = await extractPayload(actualBinary);
        const expectedPayload = await extractPayload(expectedBinary);

        expect(Buffer.compare(actualPayload, expectedPayload)).to.be.equal(0);
    });
});

describe('MetricsCompressorTest - OutputBuffer', function () {
    it('should increase internal Buffer when necessary', function () {
        const outputBuffer = new OutputBuffer(1);

        const size = 10 * 1024;
        for (let i = 0; i < size; i++) {
            outputBuffer.writeByte(i);
        }
        const buf = outputBuffer.toBuffer();

        expect(buf.length).to.be.equal(size);
    });

    it('writeBuffer: should write to output buffer', function () {
        const outputBuffer = new OutputBuffer();

        outputBuffer.writeBuffer(Buffer.from('hello world'));

        const actual = outputBuffer.toBuffer();
        const expected = Buffer.from('hello world');
        expect(Buffer.compare(actual, expected)).to.be.equal(0);
    });

    it('writeByte: should write number to buffer', function () {
        const outputBuffer = new OutputBuffer();

        outputBuffer.writeByte(42);

        const actual = outputBuffer.toBuffer();
        const expected = Buffer.from([0x2A]);
        expect(Buffer.compare(actual, expected)).to.be.equal(0);
    });

    it('writeChar: should write char to buffer', function () {
        const outputBuffer = new OutputBuffer();

        outputBuffer.writeChar('z');

        const actual = outputBuffer.toBuffer();
        const expected = Buffer.from([0x0, 0x7A]);
        expect(Buffer.compare(actual, expected)).to.be.equal(0);
    });

    it('writeDouble: should write number to buffer', function () {
        const outputBuffer = new OutputBuffer();

        outputBuffer.writeDouble(42.5);

        const actual = outputBuffer.toBuffer();
        const expected = Buffer.from([0x40, 0x45, 0x40, 0x0, 0x0, 0x0, 0x0, 0x0]);
        expect(Buffer.compare(actual, expected)).to.be.equal(0);
    });

    it('writeInt: should write number to buffer', function () {
        const outputBuffer = new OutputBuffer();

        outputBuffer.writeInt(42);

        const actual = outputBuffer.toBuffer();
        const expected = Buffer.from([0x0, 0x0, 0x0, 0x2A]);
        expect(Buffer.compare(actual, expected)).to.be.equal(0);
    });

    it('writeLong: should write number to buffer', function () {
        const outputBuffer = new OutputBuffer();

        outputBuffer.writeLong(42);

        const actual = outputBuffer.toBuffer();
        const expected = Buffer.from([0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x2A]);
        expect(Buffer.compare(actual, expected)).to.be.equal(0);
    });
});

describe('MetricsCompressorTest - MetricsDictionary', function () {
    it('getDictionaryId: should throw when word is too long', function () {
        const dictionary = new MetricsDictionary();

        expect(() => dictionary.getDictionaryId('a'.repeat(1000))).to.throw(Error);
    });

    it('getDictionaryId: should return same id for same word', function () {
        const dictionary = new MetricsDictionary();

        const word1Id = dictionary.getDictionaryId('word1');
        dictionary.getDictionaryId('word2');
        dictionary.getDictionaryId('word3');

        expect(dictionary.getDictionaryId('word1')).to.be.equal(word1Id);
    });

    it('getDictionaryId: should return growing id sequence', function () {
        const dictionary = new MetricsDictionary();

        for (let i = 0; i < 100; i++) {
            const wordId = dictionary.getDictionaryId('' + i);
            expect(wordId).to.be.equal(i);
        }
    });

    it('words: should return empty array when empty', function () {
        const dictionary = new MetricsDictionary();

        const words = dictionary.words();
        expect(words).to.have.lengthOf(0);
    });

    it('words: should return ordered array', function () {
        const dictionary = new MetricsDictionary();

        dictionary.getDictionaryId('c');
        dictionary.getDictionaryId('b');
        dictionary.getDictionaryId('a');

        const words = dictionary.words();
        expect(words).to.have.lengthOf(3);
        expect(words).to.have.all.ordered.deep.members([
            { word: 'a', dictionaryId: 2 },
            { word: 'b', dictionaryId: 1 },
            { word: 'c', dictionaryId: 0 }
        ]);
    });
});
