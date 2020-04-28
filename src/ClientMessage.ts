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

/* tslint:disable:no-bitwise */
import {Buffer} from 'safe-buffer';
import * as Long from 'long';
import {BitsUtil} from './BitsUtil';
import {ClientConnection} from './network/ClientConnection';

export const MESSAGE_TYPE_OFFSET = 0;
export const CORRELATION_ID_OFFSET = MESSAGE_TYPE_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
export const RESPONSE_BACKUP_ACKS_OFFSET = CORRELATION_ID_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
export const PARTITION_ID_OFFSET = CORRELATION_ID_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
export const FRAGMENTATION_ID_OFFSET = 0;

export const DEFAULT_FLAGS = 0;
export const BEGIN_FRAGMENT_FLAG = 1 << 15;
export const END_FRAGMENT_FLAG = 1 << 14;
export const UNFRAGMENTED_MESSAGE = BEGIN_FRAGMENT_FLAG | END_FRAGMENT_FLAG;
export const IS_FINAL_FLAG = 1 << 13;
export const BEGIN_DATA_STRUCTURE_FLAG = 1 << 12;
export const END_DATA_STRUCTURE_FLAG = 1 << 11;
export const IS_NULL_FLAG = 1 << 10;
export const IS_EVENT_FLAG = 1 << 9;
export const BACKUP_AWARE_FLAG = 1 << 8;
export const BACKUP_EVENT_FLAG = 1 << 7;

export const SIZE_OF_FRAME_LENGTH_AND_FLAGS = BitsUtil.INT_SIZE_IN_BYTES + BitsUtil.SHORT_SIZE_IN_BYTES;

export class Frame {
    content: Buffer;
    flags: number;
    next: Frame;

    constructor(content: Buffer, flags?: number) {
        this.content = content;
        if (flags) {
            this.flags = flags;
        } else {
            this.flags = DEFAULT_FLAGS;
        }
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
        return ClientMessage.isFlagSet(this.flags, BEGIN_DATA_STRUCTURE_FLAG);
    }

    isEndFrame(): boolean {
        return ClientMessage.isFlagSet(this.flags, END_DATA_STRUCTURE_FLAG);
    }

    isNullFrame(): boolean {
        return ClientMessage.isFlagSet(this.flags, IS_NULL_FLAG);
    }
}

export const NULL_FRAME = new Frame(Buffer.allocUnsafe(0), IS_NULL_FLAG);
export const BEGIN_FRAME = new Frame(Buffer.allocUnsafe(0), BEGIN_DATA_STRUCTURE_FLAG);
export const END_FRAME = new  Frame(Buffer.allocUnsafe(0), END_DATA_STRUCTURE_FLAG);

export class ForwardFrameIterator {
    private nextFrame: Frame;
    constructor(startFrame: Frame) {
        this.nextFrame = startFrame;
    }

    next(): Frame {
        const result = this.nextFrame;
        if (this.nextFrame != null) {
            this.nextFrame = this.nextFrame.next;
        }
        return result;
    }

    hasNext(): boolean {
        return this.nextFrame !== null;
    }

    peekNext(): Frame {
        return this.nextFrame;
    }
}

export class ClientMessage {
    startFrame: Frame;
    endFrame: Frame;
    private retryable: boolean;
    private connection: ClientConnection;

    private constructor(startFrame?: Frame, endFrame?: Frame) {
        this.startFrame = startFrame;
        this.endFrame = endFrame || startFrame;
    }

    static createForEncode(): ClientMessage {
        return new ClientMessage();
    }

    static createForDecode(startFrame: Frame): ClientMessage {
        return new ClientMessage(startFrame);
    }

    static isFlagSet(flags: number, flagMask: number): boolean {
        const i = flags & flagMask;
        return i === flagMask;
    }

    getStartFrame(): Frame {
        return this.startFrame;
    }

    add(frame: Frame): void {
        frame.next = null;
        if (this.startFrame == null) {
            this.startFrame = frame;
            this.endFrame = frame;
            return;
        }

        this.endFrame.next = frame;
        this.endFrame = frame;
    }

    frameIterator(): ForwardFrameIterator {
        return new ForwardFrameIterator(this.startFrame);
    }

    getMessageType(): number {
        return this.startFrame.content.readInt32LE(MESSAGE_TYPE_OFFSET);
    }

    setMessageType(messageType: number): void {
        this.startFrame.content.writeInt32LE(messageType, MESSAGE_TYPE_OFFSET);
    }

    getCorrelationId(): number {
        const low = this.startFrame.content.readInt32LE(CORRELATION_ID_OFFSET);
        const high = this.startFrame.content.readInt32LE(CORRELATION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES);
        return new Long(low, high).toNumber();
    }

    setCorrelationId(correlationId: any): void {
        if (!Long.isLong(correlationId)) {
            correlationId = Long.fromValue(correlationId);
        }
        this.startFrame.content.writeInt32LE(correlationId.low, CORRELATION_ID_OFFSET);
        this.startFrame.content.writeInt32LE(correlationId.high, CORRELATION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES);
    }

    getNumberOfBackupAcks(): number {
        return this.startFrame.content.readInt8(RESPONSE_BACKUP_ACKS_OFFSET);
    }

    getPartitionId(): number {
        return this.startFrame.content.readInt32LE(PARTITION_ID_OFFSET);
    }

    setPartitionId(partitionId: number): void {
        this.startFrame.content.writeInt32LE(partitionId, PARTITION_ID_OFFSET);
    }

    getHeaderFlags(): number {
        return this.startFrame.flags;
    }

    isRetryable(): boolean {
        return this.retryable;
    }

    setRetryable(retryable: boolean): void {
        this.retryable = retryable;
    }

    getConnection(): ClientConnection {
        return this.connection;
    }

    setConnection(connection: ClientConnection): void {
        this.connection = connection;
    }

    getTotalFrameLength(): number {
        let frameLength = 0;
        let currentFrame = this.startFrame;
        while (currentFrame != null) {
            frameLength += currentFrame.getLength();
            currentFrame = currentFrame.next;
        }
        return frameLength;
    }

    merge(fragment: ClientMessage): void {
        // Ignore the first frame of the fragment since first frame marks the fragment
        this.endFrame.next = fragment.startFrame.next;
        this.endFrame = fragment.endFrame;
    }

    copyWithNewCorrelationId(correlationId: any): ClientMessage {
        const startFrameCopy = this.startFrame.deepCopy();
        const newMessage = new ClientMessage(startFrameCopy, this.endFrame);

        newMessage.setCorrelationId(correlationId);
        newMessage.retryable = this.retryable;
        return newMessage;
    }
}
