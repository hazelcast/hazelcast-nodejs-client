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
/** @ignore *//** */

import {BitsUtil} from '../util/BitsUtil';
import {Connection} from '../network/Connection';
import {FixSizedTypesCodec} from '../codec/builtin/FixSizedTypesCodec';

const MESSAGE_TYPE_OFFSET = 0;
const CORRELATION_ID_OFFSET = MESSAGE_TYPE_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
/** @internal */
export const RESPONSE_BACKUP_ACKS_OFFSET = CORRELATION_ID_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
/** @internal */
export const PARTITION_ID_OFFSET = CORRELATION_ID_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const FRAGMENTATION_ID_OFFSET = 0;

/** @internal */
export const DEFAULT_FLAGS = 0;
const BEGIN_FRAGMENT_FLAG = 1 << 15;
const END_FRAGMENT_FLAG = 1 << 14;
const UNFRAGMENTED_MESSAGE = BEGIN_FRAGMENT_FLAG | END_FRAGMENT_FLAG;
const IS_FINAL_FLAG = 1 << 13;
const BEGIN_DATA_STRUCTURE_FLAG = 1 << 12;
const END_DATA_STRUCTURE_FLAG = 1 << 11;
const IS_NULL_FLAG = 1 << 10;
const IS_EVENT_FLAG = 1 << 9;
/** @internal */
export const IS_BACKUP_AWARE_FLAG = 1 << 8;
const IS_BACKUP_EVENT_FLAG = 1 << 7;

/** @internal */
export const SIZE_OF_FRAME_LENGTH_AND_FLAGS = BitsUtil.INT_SIZE_IN_BYTES + BitsUtil.SHORT_SIZE_IN_BYTES;

/** @internal */
export class Frame {

    content: Buffer;
    next: Frame;
    flags: number;

    constructor(content: Buffer, flags?: number) {
        this.content = content;
        this.flags = flags || DEFAULT_FLAGS;
    }

    static createInitialFrame(size: number, flags = UNFRAGMENTED_MESSAGE): Frame {
        return new Frame(Buffer.allocUnsafe(size), flags);
    }

    getLength(): number {
        return SIZE_OF_FRAME_LENGTH_AND_FLAGS + this.content.length;
    }

    copy(): Frame {
        const frame = new Frame(this.content, this.flags);
        frame.next = this.next;
        return frame;
    }

    deepCopy(): Frame {
        const content = Buffer.from(this.content);
        const frame = new Frame(content, this.flags);
        frame.next = this.next;
        return frame;
    }

    isBeginFrame(): boolean {
        return Frame.isFlagSet(this.flags, BEGIN_DATA_STRUCTURE_FLAG);
    }

    isEndFrame(): boolean {
        return Frame.isFlagSet(this.flags, END_DATA_STRUCTURE_FLAG);
    }

    isNullFrame(): boolean {
        return Frame.isFlagSet(this.flags, IS_NULL_FLAG);
    }

    hasEventFlag(): boolean {
        return Frame.isFlagSet(this.flags, IS_EVENT_FLAG);
    }

    hasBackupEventFlag(): boolean {
        return Frame.isFlagSet(this.flags, IS_BACKUP_EVENT_FLAG);
    }

    isFinalFrame(): boolean {
        return Frame.isFlagSet(this.flags, IS_FINAL_FLAG);
    }

    hasUnfragmentedMessageFlag(): boolean {
        return Frame.isFlagSet(this.flags, UNFRAGMENTED_MESSAGE);
    }

    hasBeginFragmentFlag(): boolean {
        return Frame.isFlagSet(this.flags, BEGIN_FRAGMENT_FLAG);
    }

    hasEndFragmentFlag(): boolean {
        return Frame.isFlagSet(this.flags, END_FRAGMENT_FLAG);
    }

    addFlag(flag: number): void {
        this.flags |= flag;
    }

    private static isFlagSet(flags: number, flagMask: number): boolean {
        const i = flags & flagMask;
        return i === flagMask;
    }
}

/** @internal */
export const NULL_FRAME = new Frame(Buffer.allocUnsafe(0), IS_NULL_FLAG);
/** @internal */
export const BEGIN_FRAME = new Frame(Buffer.allocUnsafe(0), BEGIN_DATA_STRUCTURE_FLAG);
/** @internal */
export const END_FRAME = new Frame(Buffer.allocUnsafe(0), END_DATA_STRUCTURE_FLAG);

/** @internal */
export class ClientMessage {

    startFrame: Frame;
    endFrame: Frame;
    private retryable: boolean;
    private connection: Connection;
    private containsSerializedDataInRequest = false;
    private _nextFrame: Frame;
    // cached total length for encode case
    private cachedTotalLength: number;

    private constructor(startFrame?: Frame, endFrame?: Frame) {
        this.startFrame = startFrame;
        this.endFrame = endFrame || startFrame;
        this._nextFrame = startFrame;
    }

    static createForEncode(): ClientMessage {
        return new ClientMessage();
    }

    static createForDecode(startFrame: Frame, endFrame?: Frame): ClientMessage {
        return new ClientMessage(startFrame, endFrame);
    }

    getStartFrame(): Frame {
        return this.startFrame;
    }

    nextFrame(): Frame {
        const result = this._nextFrame;
        if (this._nextFrame != null) {
            this._nextFrame = this._nextFrame.next;
        }
        return result;
    }

    hasNextFrame(): boolean {
        return this._nextFrame != null;
    }

    peekNextFrame(): Frame {
        return this._nextFrame;
    }

    resetNextFrame(): void {
        this._nextFrame = this.startFrame;
    }

    addFrame(frame: Frame): void {
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

    getMessageType(): number {
        return this.startFrame.content.readInt32LE(MESSAGE_TYPE_OFFSET);
    }

    setMessageType(messageType: number): void {
        this.startFrame.content.writeInt32LE(messageType, MESSAGE_TYPE_OFFSET);
    }

    getCorrelationId(): number {
        return FixSizedTypesCodec.decodeNumberFromLong(this.startFrame.content, CORRELATION_ID_OFFSET);
    }

    /**
     * Resets correlation id to -1.
     *
     * Important note: after this call a proper (non-negative) correlation id
     * must be set before sending the message to the cluster.
     */
    resetCorrelationId(): void {
        this.startFrame.content.writeInt32LE(0xFFFFFFFF|0, CORRELATION_ID_OFFSET);
        this.startFrame.content.writeInt32LE(0xFFFFFFFF|0, CORRELATION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES);
    }

    /**
     * Sets correlation id for the message. The id must be a non-negative
     * integer.
     *
     * @param correlationId correlation id
     */
    setCorrelationId(correlationId: number): void {
        FixSizedTypesCodec.encodeNonNegativeNumberAsLong(this.startFrame.content, CORRELATION_ID_OFFSET, correlationId);
    }

    getPartitionId(): number {
        return this.startFrame.content.readInt32LE(PARTITION_ID_OFFSET);
    }

    setPartitionId(partitionId: number): void {
        this.startFrame.content.writeInt32LE(partitionId, PARTITION_ID_OFFSET);
    }

    getNumberOfBackupAcks(): number {
        return this.startFrame.content.readUInt8(RESPONSE_BACKUP_ACKS_OFFSET);
    }

    isRetryable(): boolean {
        return this.retryable;
    }

    setRetryable(retryable: boolean): void {
        this.retryable = retryable;
    }

    getConnection(): Connection {
        return this.connection;
    }

    setConnection(connection: Connection): void {
        this.connection = connection;
    }

    getTotalLength(): number {
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

    getFragmentationId(): number {
        return FixSizedTypesCodec.decodeLong(this.startFrame.content, FRAGMENTATION_ID_OFFSET).toNumber();
    }

    merge(fragment: ClientMessage): void {
        // Should be called after calling dropFragmentationFrame() on the fragment
        this.endFrame.next = fragment.startFrame;
        this.endFrame = fragment.endFrame;
        this.cachedTotalLength = undefined;
    }

    dropFragmentationFrame(): void {
        this.startFrame = this.startFrame.next;
        this._nextFrame = this._nextFrame.next;
        this.cachedTotalLength = undefined;
    }

    isContainsSerializedDataInRequest(): boolean {
        return this.containsSerializedDataInRequest;
    }

    setContainsSerializedDataInRequest(containsSerializedDataInRequest:boolean): void {
        this.containsSerializedDataInRequest = containsSerializedDataInRequest;
    }

    copyWithNewCorrelationId(): ClientMessage {
        const startFrameCopy = this.startFrame.deepCopy();
        const newMessage = new ClientMessage(startFrameCopy, this.endFrame);

        newMessage.resetCorrelationId();
        newMessage.retryable = this.retryable;
        newMessage.containsSerializedDataInRequest = this.containsSerializedDataInRequest;
        return newMessage;
    }

    copyMessageWithSharedNonInitialFrames(): ClientMessage {
        const startFrameCopy = this.startFrame.deepCopy();
        const newMessage = new ClientMessage(startFrameCopy, this.endFrame);

        newMessage.retryable = this.retryable;
        newMessage.containsSerializedDataInRequest = this.containsSerializedDataInRequest;
        return newMessage;
    }

    writeTo(buffer: Buffer, offset = 0): number {
        let pos = offset;
        let currentFrame = this.startFrame;
        while (currentFrame != null) {
            const isLastFrame = currentFrame.next == null;
            buffer.writeInt32LE(currentFrame.content.length + SIZE_OF_FRAME_LENGTH_AND_FLAGS, pos);
            if (isLastFrame) {
                buffer.writeUInt16LE(currentFrame.flags | IS_FINAL_FLAG, pos + BitsUtil.INT_SIZE_IN_BYTES);
            } else {
                buffer.writeUInt16LE(currentFrame.flags, pos + BitsUtil.INT_SIZE_IN_BYTES);
            }
            pos += SIZE_OF_FRAME_LENGTH_AND_FLAGS;
            currentFrame.content.copy(buffer, pos);
            pos += currentFrame.content.length;
            currentFrame = currentFrame.next;
        }
        return pos;
    }

    toBuffer(): Buffer {
        const totalLength = this.getTotalLength();
        const buffer = Buffer.allocUnsafe(totalLength);
        this.writeTo(buffer);
        return buffer;
    }
}

/** @internal */
export type ClientMessageHandler = (message: ClientMessage) => void;
