"use strict";
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
/** @ignore */ /** */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsDictionary = exports.OutputBuffer = exports.MetricsCompressor = exports.ValueType = exports.ProbeUnit = void 0;
const zlib = require("zlib");
const Long = require("long");
const BitsUtil_1 = require("../util/BitsUtil");
/**
 * Note: enum values must match with Java's ProbeUnit ordinals.
 * @internal
 */
var ProbeUnit;
(function (ProbeUnit) {
    ProbeUnit[ProbeUnit["BYTES"] = 0] = "BYTES";
    ProbeUnit[ProbeUnit["MS"] = 1] = "MS";
    ProbeUnit[ProbeUnit["NS"] = 2] = "NS";
    ProbeUnit[ProbeUnit["PERCENT"] = 3] = "PERCENT";
    ProbeUnit[ProbeUnit["COUNT"] = 4] = "COUNT";
    ProbeUnit[ProbeUnit["BOOLEAN"] = 5] = "BOOLEAN";
    ProbeUnit[ProbeUnit["ENUM"] = 6] = "ENUM";
    /**
     * Note: This unit and subsequent ones should be processed
     * in a backwards-compatible way (see ProbeUnit#newUnit
     * handling in Java). If we start using it, we need to
     * port this functionality.
     */
    ProbeUnit[ProbeUnit["US"] = 7] = "US";
})(ProbeUnit = exports.ProbeUnit || (exports.ProbeUnit = {}));
/**
 * Note: enum values must match with Java's ValueType ordinals.
 * @internal
 */
var ValueType;
(function (ValueType) {
    ValueType[ValueType["LONG"] = 0] = "LONG";
    ValueType[ValueType["DOUBLE"] = 1] = "DOUBLE";
})(ValueType = exports.ValueType || (exports.ValueType = {}));
const MASK_PREFIX = 1;
const MASK_METRIC = 1 << 1;
const MASK_DISCRIMINATOR = 1 << 2;
const MASK_DISCRIMINATOR_VALUE = 1 << 3;
const MASK_UNIT = 1 << 4;
const MASK_EXCLUDED_TARGETS = 1 << 5;
const MASK_TAG_COUNT = 1 << 6;
const NULL_DICTIONARY_ID = -1;
const NULL_UNIT = -1;
const UNSIGNED_BYTE_MAX_VALUE = 255;
const BITS_IN_BYTE = 8;
const BYTE_MASK = 0xFF;
const BINARY_FORMAT_VERSION = 1;
const SIZE_VERSION = 2;
const SIZE_DICTIONARY_BLOB = 4;
const SIZE_COUNT_METRICS = 4;
/**
 * This class generates binary representation of client metrics
 * (i.e. numeric statistics).
 * @internal
 */
class MetricsCompressor {
    constructor() {
        this.metricsCount = 0;
        this.metricsBuffer = new OutputBuffer();
        this.dictionaryBuffer = new OutputBuffer();
        this.dictionary = new MetricsDictionary();
    }
    addLong(descriptor, value) {
        this.writeDescriptor(descriptor);
        this.metricsBuffer.writeByte(ValueType.LONG);
        this.metricsBuffer.writeLong(value);
    }
    addDouble(descriptor, value) {
        this.writeDescriptor(descriptor);
        this.metricsBuffer.writeByte(ValueType.DOUBLE);
        this.metricsBuffer.writeDouble(value);
    }
    generateBlob() {
        // start with Promise.resolve() to catch all errors
        return Promise.resolve()
            .then(() => {
            this.writeDictionary();
            const metricsBuf = this.metricsBuffer.toBuffer();
            const dictionaryBuf = this.dictionaryBuffer.toBuffer();
            return Promise.all([
                this.compressBuffer(metricsBuf),
                this.compressBuffer(dictionaryBuf)
            ]);
        })
            .then(([compressedMetricsBuf, compressedDictionaryBuf]) => {
            const completeSize = SIZE_VERSION
                + SIZE_DICTIONARY_BLOB + compressedDictionaryBuf.length
                + SIZE_COUNT_METRICS + compressedMetricsBuf.length;
            const finalBuf = new OutputBuffer(completeSize);
            finalBuf.writeByte((BINARY_FORMAT_VERSION >>> BITS_IN_BYTE) & BYTE_MASK);
            finalBuf.writeByte(BINARY_FORMAT_VERSION & BYTE_MASK);
            finalBuf.writeInt(compressedDictionaryBuf.length);
            finalBuf.writeBuffer(compressedDictionaryBuf);
            finalBuf.writeInt(this.metricsCount);
            finalBuf.writeBuffer(compressedMetricsBuf);
            return finalBuf.toBuffer();
        });
    }
    writeDescriptor(descriptor) {
        const mask = this.calculateDescriptorMask(descriptor);
        this.metricsBuffer.writeByte(mask);
        if ((mask & MASK_PREFIX) === 0) {
            this.metricsBuffer.writeInt(this.getDictionaryId(descriptor.prefix));
        }
        if ((mask & MASK_METRIC) === 0) {
            this.metricsBuffer.writeInt(this.getDictionaryId(descriptor.metric));
        }
        if ((mask & MASK_DISCRIMINATOR) === 0) {
            this.metricsBuffer.writeInt(this.getDictionaryId(descriptor.discriminator));
        }
        if ((mask & MASK_DISCRIMINATOR_VALUE) === 0) {
            this.metricsBuffer.writeInt(this.getDictionaryId(descriptor.discriminatorValue));
        }
        if ((mask & MASK_UNIT) == 0) {
            if (descriptor.unit === undefined) {
                this.metricsBuffer.writeByte(NULL_UNIT);
            }
            else {
                this.metricsBuffer.writeByte(descriptor.unit);
            }
        }
        // include excludedTargets and tags bytes for compatibility purposes
        if ((mask & MASK_EXCLUDED_TARGETS) == 0) {
            this.metricsBuffer.writeByte(0);
        }
        if ((mask & MASK_TAG_COUNT) == 0) {
            this.metricsBuffer.writeByte(0);
        }
        this.metricsCount++;
        this.lastDescriptor = descriptor;
    }
    calculateDescriptorMask(descriptor) {
        let mask = 0;
        if (this.lastDescriptor === undefined) {
            return mask;
        }
        if (descriptor.prefix === this.lastDescriptor.prefix) {
            mask |= MASK_PREFIX;
        }
        if (descriptor.metric === this.lastDescriptor.metric) {
            mask |= MASK_METRIC;
        }
        if (descriptor.discriminator === this.lastDescriptor.discriminator) {
            mask |= MASK_DISCRIMINATOR;
        }
        if (descriptor.discriminatorValue === this.lastDescriptor.discriminatorValue) {
            mask |= MASK_DISCRIMINATOR_VALUE;
        }
        if (descriptor.unit === this.lastDescriptor.unit) {
            mask |= MASK_UNIT;
        }
        // include excludedTargets and tags bits for compatibility purposes
        mask |= MASK_EXCLUDED_TARGETS;
        mask |= MASK_TAG_COUNT;
        return mask;
    }
    getDictionaryId(word) {
        if (word === undefined) {
            return NULL_DICTIONARY_ID;
        }
        return this.dictionary.getDictionaryId(word);
    }
    writeDictionary() {
        const words = this.dictionary.words();
        this.dictionaryBuffer.writeInt(words.length);
        let lastWordText = '';
        for (const word of words) {
            const wordText = word.word;
            if (wordText.length > UNSIGNED_BYTE_MAX_VALUE) {
                // this should have been checked earlier, this is a safety check
                throw new Error('Dictionary element too long: ' + wordText);
            }
            const maxCommonLen = Math.min(lastWordText.length, wordText.length);
            let commonLen = 0;
            while (commonLen < maxCommonLen
                && wordText.charAt(commonLen) === lastWordText.charAt(commonLen)) {
                commonLen++;
            }
            const diffLen = wordText.length - commonLen;
            this.dictionaryBuffer.writeInt(word.dictionaryId);
            this.dictionaryBuffer.writeByte(commonLen);
            this.dictionaryBuffer.writeByte(diffLen);
            for (let i = commonLen; i < wordText.length; i++) {
                this.dictionaryBuffer.writeChar(wordText.charAt(i));
            }
            lastWordText = wordText;
        }
    }
    compressBuffer(buf) {
        return new Promise((resolve, reject) => {
            zlib.deflate(buf, 
            // set level to 1 for best speed (less CPU overhead)
            { level: 1 }, (err, compressedBuf) => {
                if (err) {
                    return reject(err);
                }
                resolve(compressedBuf);
            });
        });
    }
}
exports.MetricsCompressor = MetricsCompressor;
const OUTPUT_BUFFER_INITIAL_SIZE = 1024;
const OUTPUT_BUFFER_GROW_FACTOR = 1.2;
/**
 * Simple grow-on-demand wrapper for Buffer.
 * @internal
 */
class OutputBuffer {
    constructor(size) {
        this.buffer = Buffer.allocUnsafe(size || OUTPUT_BUFFER_INITIAL_SIZE);
        this.pos = 0;
    }
    toBuffer() {
        return this.buffer.slice(0, this.pos);
    }
    writeBuffer(buf) {
        this.ensureAvailable(buf.length);
        buf.copy(this.buffer, this.pos);
        this.pos += buf.length;
    }
    writeByte(byte) {
        this.ensureAvailable(BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES);
        BitsUtil_1.BitsUtil.writeUInt8(this.buffer, this.pos, byte & BYTE_MASK);
        this.pos += BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES;
    }
    writeChar(char) {
        this.ensureAvailable(BitsUtil_1.BitsUtil.CHAR_SIZE_IN_BYTES);
        BitsUtil_1.BitsUtil.writeUInt16(this.buffer, this.pos, char.charCodeAt(0), true);
        this.pos += BitsUtil_1.BitsUtil.CHAR_SIZE_IN_BYTES;
    }
    writeDouble(double) {
        this.ensureAvailable(BitsUtil_1.BitsUtil.DOUBLE_SIZE_IN_BYTES);
        BitsUtil_1.BitsUtil.writeDouble(this.buffer, this.pos, double, true);
        this.pos += BitsUtil_1.BitsUtil.DOUBLE_SIZE_IN_BYTES;
    }
    writeInt(int) {
        this.ensureAvailable(BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES);
        BitsUtil_1.BitsUtil.writeInt32(this.buffer, this.pos, int, true);
        this.pos += BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
    }
    writeLong(value) {
        const long = Long.fromNumber(value);
        this.ensureAvailable(BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES);
        BitsUtil_1.BitsUtil.writeInt32(this.buffer, this.pos, long.high, true);
        this.pos += BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
        BitsUtil_1.BitsUtil.writeInt32(this.buffer, this.pos, long.low, true);
        this.pos += BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
    }
    available() {
        return this.buffer.length - this.pos;
    }
    ensureAvailable(size) {
        if (this.available() < size) {
            // grow more memory than needed
            let newSize = Math.floor((this.pos + size) * OUTPUT_BUFFER_GROW_FACTOR);
            if (newSize % 2 !== 0) {
                newSize++;
            }
            const newBuffer = Buffer.allocUnsafe(newSize);
            this.buffer.copy(newBuffer, 0, 0, this.pos);
            this.buffer = newBuffer;
        }
    }
}
exports.OutputBuffer = OutputBuffer;
/**
 * Metrics dictionary used to store word -> id mapping.
 * @internal
 */
class MetricsDictionary {
    constructor() {
        this.ids = new Map();
    }
    getDictionaryId(word) {
        if (word.length > UNSIGNED_BYTE_MAX_VALUE) {
            throw new Error('Too long value in metric descriptor, maximum is '
                + UNSIGNED_BYTE_MAX_VALUE + ': ' + word);
        }
        let id = this.ids.get(word);
        if (id === undefined) {
            id = this.ids.size;
            this.ids.set(word, id);
        }
        return id;
    }
    /**
     * Returns all stored word<->id mappings ordered by word.
     */
    words() {
        if (this.ids.size === 0) {
            return [];
        }
        const words = Array.from(this.ids.entries())
            .map(([word, dictionaryId]) => ({ word, dictionaryId }));
        words.sort((w1, w2) => {
            if (w1.word < w2.word) {
                return -1;
            }
            if (w1.word > w2.word) {
                return 1;
            }
            return 0;
        });
        return words;
    }
}
exports.MetricsDictionary = MetricsDictionary;
//# sourceMappingURL=MetricsCompressor.js.map