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
exports.ClientMessage = exports.END_FRAME = exports.BEGIN_FRAME = exports.NULL_FRAME = exports.Frame = exports.SIZE_OF_FRAME_LENGTH_AND_FLAGS = exports.IS_BACKUP_AWARE_FLAG = exports.DEFAULT_FLAGS = exports.PARTITION_ID_OFFSET = exports.RESPONSE_BACKUP_ACKS_OFFSET = void 0;
const BitsUtil_1 = require("../util/BitsUtil");
const FixSizedTypesCodec_1 = require("../codec/builtin/FixSizedTypesCodec");
const MESSAGE_TYPE_OFFSET = 0;
const CORRELATION_ID_OFFSET = MESSAGE_TYPE_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
/** @internal */
exports.RESPONSE_BACKUP_ACKS_OFFSET = CORRELATION_ID_OFFSET + BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES;
/** @internal */
exports.PARTITION_ID_OFFSET = CORRELATION_ID_OFFSET + BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES;
const FRAGMENTATION_ID_OFFSET = 0;
/** @internal */
exports.DEFAULT_FLAGS = 0;
const BEGIN_FRAGMENT_FLAG = 1 << 15;
const END_FRAGMENT_FLAG = 1 << 14;
const UNFRAGMENTED_MESSAGE = BEGIN_FRAGMENT_FLAG | END_FRAGMENT_FLAG;
const IS_FINAL_FLAG = 1 << 13;
const BEGIN_DATA_STRUCTURE_FLAG = 1 << 12;
const END_DATA_STRUCTURE_FLAG = 1 << 11;
const IS_NULL_FLAG = 1 << 10;
const IS_EVENT_FLAG = 1 << 9;
/** @internal */
exports.IS_BACKUP_AWARE_FLAG = 1 << 8;
const IS_BACKUP_EVENT_FLAG = 1 << 7;
/** @internal */
exports.SIZE_OF_FRAME_LENGTH_AND_FLAGS = BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES + BitsUtil_1.BitsUtil.SHORT_SIZE_IN_BYTES;
/** @internal */
class Frame {
    constructor(content, flags) {
        this.content = content;
        this.flags = flags || exports.DEFAULT_FLAGS;
    }
    static createInitialFrame(size, flags = UNFRAGMENTED_MESSAGE) {
        return new Frame(Buffer.allocUnsafe(size), flags);
    }
    getLength() {
        return exports.SIZE_OF_FRAME_LENGTH_AND_FLAGS + this.content.length;
    }
    copy() {
        const frame = new Frame(this.content, this.flags);
        frame.next = this.next;
        return frame;
    }
    deepCopy() {
        const content = Buffer.from(this.content);
        const frame = new Frame(content, this.flags);
        frame.next = this.next;
        return frame;
    }
    isBeginFrame() {
        return Frame.isFlagSet(this.flags, BEGIN_DATA_STRUCTURE_FLAG);
    }
    isEndFrame() {
        return Frame.isFlagSet(this.flags, END_DATA_STRUCTURE_FLAG);
    }
    isNullFrame() {
        return Frame.isFlagSet(this.flags, IS_NULL_FLAG);
    }
    hasEventFlag() {
        return Frame.isFlagSet(this.flags, IS_EVENT_FLAG);
    }
    hasBackupEventFlag() {
        return Frame.isFlagSet(this.flags, IS_BACKUP_EVENT_FLAG);
    }
    isFinalFrame() {
        return Frame.isFlagSet(this.flags, IS_FINAL_FLAG);
    }
    hasUnfragmentedMessageFlag() {
        return Frame.isFlagSet(this.flags, UNFRAGMENTED_MESSAGE);
    }
    hasBeginFragmentFlag() {
        return Frame.isFlagSet(this.flags, BEGIN_FRAGMENT_FLAG);
    }
    hasEndFragmentFlag() {
        return Frame.isFlagSet(this.flags, END_FRAGMENT_FLAG);
    }
    addFlag(flag) {
        this.flags |= flag;
    }
    static isFlagSet(flags, flagMask) {
        const i = flags & flagMask;
        return i === flagMask;
    }
}
exports.Frame = Frame;
/** @internal */
exports.NULL_FRAME = new Frame(Buffer.allocUnsafe(0), IS_NULL_FLAG);
/** @internal */
exports.BEGIN_FRAME = new Frame(Buffer.allocUnsafe(0), BEGIN_DATA_STRUCTURE_FLAG);
/** @internal */
exports.END_FRAME = new Frame(Buffer.allocUnsafe(0), END_DATA_STRUCTURE_FLAG);
/** @internal */
class ClientMessage {
    constructor(startFrame, endFrame) {
        this.containsSerializedDataInRequest = false;
        this.startFrame = startFrame;
        this.endFrame = endFrame || startFrame;
        this._nextFrame = startFrame;
    }
    static createForEncode() {
        return new ClientMessage();
    }
    static createForDecode(startFrame, endFrame) {
        return new ClientMessage(startFrame, endFrame);
    }
    getStartFrame() {
        return this.startFrame;
    }
    nextFrame() {
        const result = this._nextFrame;
        if (this._nextFrame != null) {
            this._nextFrame = this._nextFrame.next;
        }
        return result;
    }
    hasNextFrame() {
        return this._nextFrame != null;
    }
    peekNextFrame() {
        return this._nextFrame;
    }
    resetNextFrame() {
        this._nextFrame = this.startFrame;
    }
    addFrame(frame) {
        this.cachedTotalLength = undefined;
        frame.next = null;
        if (this.startFrame == null) {
            this.startFrame = frame;
            this.endFrame = frame;
            this._nextFrame = frame;
            return;
        }
        this.endFrame.next = frame;
        this.endFrame = frame;
    }
    getMessageType() {
        return this.startFrame.content.readInt32LE(MESSAGE_TYPE_OFFSET);
    }
    setMessageType(messageType) {
        this.startFrame.content.writeInt32LE(messageType, MESSAGE_TYPE_OFFSET);
    }
    getCorrelationId() {
        return FixSizedTypesCodec_1.FixSizedTypesCodec.decodeNumberFromLong(this.startFrame.content, CORRELATION_ID_OFFSET);
    }
    /**
     * Resets correlation id to -1.
     *
     * Important note: after this call a proper (non-negative) correlation id
     * must be set before sending the message to the cluster.
     */
    resetCorrelationId() {
        this.startFrame.content.writeInt32LE(0xFFFFFFFF | 0, CORRELATION_ID_OFFSET);
        this.startFrame.content.writeInt32LE(0xFFFFFFFF | 0, CORRELATION_ID_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES);
    }
    /**
     * Sets correlation id for the message. The id must be a non-negative
     * integer.
     *
     * @param correlationId correlation id
     */
    setCorrelationId(correlationId) {
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeNonNegativeNumberAsLong(this.startFrame.content, CORRELATION_ID_OFFSET, correlationId);
    }
    getPartitionId() {
        return this.startFrame.content.readInt32LE(exports.PARTITION_ID_OFFSET);
    }
    setPartitionId(partitionId) {
        this.startFrame.content.writeInt32LE(partitionId, exports.PARTITION_ID_OFFSET);
    }
    getNumberOfBackupAcks() {
        return this.startFrame.content.readUInt8(exports.RESPONSE_BACKUP_ACKS_OFFSET);
    }
    isRetryable() {
        return this.retryable;
    }
    setRetryable(retryable) {
        this.retryable = retryable;
    }
    getConnection() {
        return this.connection;
    }
    setConnection(connection) {
        this.connection = connection;
    }
    getTotalLength() {
        if (this.cachedTotalLength !== undefined) {
            return this.cachedTotalLength;
        }
        let totalLength = 0;
        let currentFrame = this.startFrame;
        while (currentFrame != null) {
            totalLength += currentFrame.getLength();
            currentFrame = currentFrame.next;
        }
        this.cachedTotalLength = totalLength;
        return totalLength;
    }
    getFragmentationId() {
        return FixSizedTypesCodec_1.FixSizedTypesCodec.decodeLong(this.startFrame.content, FRAGMENTATION_ID_OFFSET).toNumber();
    }
    merge(fragment) {
        // Should be called after calling dropFragmentationFrame() on the fragment
        this.endFrame.next = fragment.startFrame;
        this.endFrame = fragment.endFrame;
        this.cachedTotalLength = undefined;
    }
    dropFragmentationFrame() {
        this.startFrame = this.startFrame.next;
        this._nextFrame = this._nextFrame.next;
        this.cachedTotalLength = undefined;
    }
    isContainsSerializedDataInRequest() {
        return this.containsSerializedDataInRequest;
    }
    setContainsSerializedDataInRequest(containsSerializedDataInRequest) {
        this.containsSerializedDataInRequest = containsSerializedDataInRequest;
    }
    copyWithNewCorrelationId() {
        const startFrameCopy = this.startFrame.deepCopy();
        const newMessage = new ClientMessage(startFrameCopy, this.endFrame);
        newMessage.resetCorrelationId();
        newMessage.retryable = this.retryable;
        newMessage.containsSerializedDataInRequest = this.containsSerializedDataInRequest;
        return newMessage;
    }
    copyMessageWithSharedNonInitialFrames() {
        const startFrameCopy = this.startFrame.deepCopy();
        const newMessage = new ClientMessage(startFrameCopy, this.endFrame);
        newMessage.retryable = this.retryable;
        newMessage.containsSerializedDataInRequest = this.containsSerializedDataInRequest;
        return newMessage;
    }
    writeTo(buffer, offset = 0) {
        let pos = offset;
        let currentFrame = this.startFrame;
        while (currentFrame != null) {
            const isLastFrame = currentFrame.next == null;
            buffer.writeInt32LE(currentFrame.content.length + exports.SIZE_OF_FRAME_LENGTH_AND_FLAGS, pos);
            if (isLastFrame) {
                buffer.writeUInt16LE(currentFrame.flags | IS_FINAL_FLAG, pos + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES);
            }
            else {
                buffer.writeUInt16LE(currentFrame.flags, pos + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES);
            }
            pos += exports.SIZE_OF_FRAME_LENGTH_AND_FLAGS;
            currentFrame.content.copy(buffer, pos);
            pos += currentFrame.content.length;
            currentFrame = currentFrame.next;
        }
        return pos;
    }
    toBuffer() {
        const totalLength = this.getTotalLength();
        const buffer = Buffer.allocUnsafe(totalLength);
        this.writeTo(buffer);
        return buffer;
    }
}
exports.ClientMessage = ClientMessage;
//# sourceMappingURL=ClientMessage.js.map