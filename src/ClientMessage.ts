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

/* tslint:disable:no-bitwise */
/*
 Client Message is the carrier framed data as defined below.
 Any request parameter, response or event data will be carried in the payload.
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |R|                      Frame Length                           |
 +-------------+---------------+---------------------------------+
 |  Version    |B|E|  Flags    |               Type              |
 +-------------+---------------+---------------------------------+
 |                       CorrelationId                           |
 |                                                               |
 +---------------------------------------------------------------+
 |                        PartitionId                            |
 +-----------------------------+---------------------------------+
 |        Data Offset          |                                 |
 +-----------------------------+                                 |
 |                      Message Payload Data                    ...
 |                                                              ...
 */

import {Buffer} from 'safe-buffer';
import * as Long from 'long';
import {BitsUtil} from './BitsUtil';
import {ClientConnection} from './invocation/ClientConnection';

export class LinkedListFrame {
    protected headFrame: Frame;
    protected tailFrame: Frame;

    constructor(item: Frame) {
        this.headFrame = item;
        this.tailFrame = item;
    }

    // tslint:disable-next-line:typedef
    get() {
        return this.headFrame;
    }

    // tslint:disable-next-line:typedef
    getIndex(index: number) {
        if (index >= 0 && index < this.size()) {
            return this.node(index);
        } else {
            console.log('error');
        }
    }

    // tslint:disable-next-line:typedef
    node(index: number) {
        if (index < (this.size() >> 1)) {
            // tslint:disable-next-line:no-shadowed-variable
            let x = this.headFrame;
            // tslint:disable-next-line:no-shadowed-variable
            for (let i = 0; i < index; i++) {
                x = x.next;
            }
            return x;
        } else {
            let x = this.tailFrame;
            for (let i = this.size() - 1; i > index; i--) {
                x = x.prev;
            }
            return x;
        }
    }

    size(): number {
        let count = 0;
        let currentItem: Frame = this.headFrame;
        if (!currentItem) {
            return count;
        } else {
            while (true) {
                count++;
                if (currentItem.next) {
                    currentItem = currentItem.next;
                } else {
                    return count;
                }
            }
        }
    }

    next(): Frame {
        return this.headFrame.next;
    }

    add(val: any): Frame {
        const newItem = new Frame(val);

        if (!this.headFrame) {
            this.headFrame = newItem;
            this.tailFrame = this.headFrame;
            return this.headFrame;
        }
        newItem.prev = this.tailFrame;
        this.tailFrame.next = newItem;
        this.tailFrame = this.tailFrame.next;

        return this.tailFrame;
    }
}

export class Frame {
    public next: Frame;
    public prev: Frame;
    public content: Buffer;
    public flags: number;

    constructor(content: Buffer, flag: number = 0) {
        this.content = content;
        this.flags = flag;
        this.next = null;
    }

    // tslint:disable-next-line:typedef
    public copy() {
        const newContent: Buffer = Buffer.from(this.content);
        return new Frame(newContent, this.flags);
    }

    public isEndFrame(): boolean {
        return ClientMessage.isFlagSet(this.flags, ClientMessage.END_DATA_STRUCTURE_FLAG);
    }

    public isNullFrame(): boolean {
        return ClientMessage.isFlagSet(this.flags, ClientMessage.IS_NULL_FLAG);
    }

    public getSize(): number {
        if (this.content == null) {
            return ClientMessage.SIZE_OF_FRAME_LENGTH_AND_FLAGS;
        } else {
            return ClientMessage.SIZE_OF_FRAME_LENGTH_AND_FLAGS + this.content.length;
        }
    }

    public previous(): Frame {
        return this.prev;
    }

    public equals(o: Frame): boolean {
        if (o === null) {
            return false;
        }

        const frame: Frame = o;

        if (this.flags !== frame.flags) {
            return false;
        }
        return frame.content.equals(this.content);

    }

}

export class ClientMessage extends LinkedListFrame {

    // All offsets here are offset of frame.content byte[]
    // Note that frames have frame length and flags before this byte[] content
    public static TYPE_FIELD_OFFSET = 0;
    public static CORRELATION_ID_FIELD_OFFSET = ClientMessage.TYPE_FIELD_OFFSET + BitsUtil.SHORT_SIZE_IN_BYTES;
    // tslint:disable-next-line:comment-format
    //offset valid for fragmentation frames only
    public static FRAGMENTATION_ID_OFFSET = 0;
    // tslint:disable-next-line:comment-format
    //optional fixed partition id field offset
    public static PARTITION_ID_FIELD_OFFSET = ClientMessage.CORRELATION_ID_FIELD_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;

    public static DEFAULT_FLAGS = 0;
    public static BEGIN_FRAGMENT_FLAG = 1 << 15;
    public static END_FRAGMENT_FLAG = 1 << 14;
    public static UNFRAGMENTED_MESSAGE = ClientMessage.BEGIN_FRAGMENT_FLAG | ClientMessage.END_FRAGMENT_FLAG;
    public static IS_FINAL_FLAG = 1 << 13;
    public static BEGIN_DATA_STRUCTURE_FLAG = 1 << 12;
    public static END_DATA_STRUCTURE_FLAG = 1 << 11;
    public static IS_NULL_FLAG = 1 << 10;
    public static IS_EVENT_FLAG = 1 << 9;

    public static SIZE_OF_FRAME_LENGTH_AND_FLAGS = BitsUtil.INT_SIZE_IN_BYTES + BitsUtil.SHORT_SIZE_IN_BYTES;
    public static NULL_FRAME: Frame = new Frame(Buffer.allocUnsafe(0), ClientMessage.IS_NULL_FLAG);
    public static BEGIN_FRAME: Frame = new Frame(Buffer.allocUnsafe(0), ClientMessage.BEGIN_DATA_STRUCTURE_FLAG);
    public static END_FRAME: Frame = new Frame(Buffer.allocUnsafe(0), ClientMessage.END_DATA_STRUCTURE_FLAG);

    private retryable: boolean;
    private acquiresResource: boolean;
    private operationName: string;
    private connection: ClientConnection;

    constructor(frames: Frame = null) {
        super(frames);
    }

    public static createForEncode(): ClientMessage {
        return new ClientMessage();
    }

    public static createForDecode(frames: Frame): ClientMessage {
        return new ClientMessage(frames);
    }

    public getMessageType(): number {
        return BitsUtil.readInt8(this.get().content, ClientMessage.TYPE_FIELD_OFFSET);
    }

    public setMessageType(messageType: number): ClientMessage {
        BitsUtil.writeInt8(this.get().content, ClientMessage.TYPE_FIELD_OFFSET, messageType);
        return this;
    }

    public getCorrelationId(): Long {
        return BitsUtil.readLong(this.get().content, ClientMessage.CORRELATION_ID_FIELD_OFFSET);
    }

    public setCorrelationId(correlationId: number): ClientMessage {
        BitsUtil.writeLong(this.get().content, ClientMessage.PARTITION_ID_FIELD_OFFSET, correlationId);
        return this;
    }

    public getPartitionId(): number {
        return BitsUtil.readInt32(this.get().content, ClientMessage.PARTITION_ID_FIELD_OFFSET, false);
    }

    public setPartitionId(partitionId: number): ClientMessage {
        BitsUtil.writeInt32(this.get().content, ClientMessage.PARTITION_ID_FIELD_OFFSET, partitionId, false);
        return this;
    }

    public getHeaderFlags(): number {
        return this.get().flags;
    }

    public isRetryable(): boolean {
        return this.retryable;
    }

    public isAcquiresResource(): boolean {
        return this.acquiresResource;
    }

    public setAcquiresResource(acquiresResource: boolean): void {
        this.acquiresResource = acquiresResource;
    }

    public setRetryable(isRetryable: boolean): void {
        this.retryable = isRetryable;
    }

    public setOperationName(operationName: string): void {
        this.operationName = operationName;
    }

    public getOperationName(): string {
        return this.operationName;
    }

    // tslint:disable-next-line:member-ordering
    public static isFlagSet(flags: number, flagMask: number): boolean {
        const i: number = flags & flagMask;
        return i === flagMask;
    }

    public setConnection(connection: ClientConnection): void {
        this.connection = connection;
    }

    public getConnection(): ClientConnection {
        return this.connection;
    }

    public getFrameLength(): number {
        let frameLength = 0;
        let currentItem: Frame = this.headFrame;
        if (!currentItem) {
            return frameLength;
        } else {
            while (true) {
                frameLength += currentItem.getSize();
                if (currentItem.next) {
                    currentItem = currentItem.next;
                } else {
                    return frameLength;
                }
            }
        }

    }

    public isUrgent(): boolean {
        return false;
    }

    public toString(): string {
        const sb = 'ClientMessage{\n' + 'connection=' + this.connection;
        if (this.size() > 0) {
            sb.concat(', length=' + this.getFrameLength() +
                ', operation=' + this.getCorrelationId() +
                ', operation=' + this.getOperationName() +
                ', messageType=' + this.getMessageType() +
                ', isRetryable=' + this.isRetryable() +
                ', isEvent=' + ClientMessage.isFlagSet(this.get().flags, ClientMessage.IS_EVENT_FLAG) +
                ', isFragmented=' + !ClientMessage.isFlagSet(this.get().flags, ClientMessage.UNFRAGMENTED_MESSAGE) + '}');

        }

        return sb.toString();
    }

    public copyWithNewCorrelationId(correlationId: number): ClientMessage {
        const newMessage: ClientMessage = new ClientMessage();

        const initialFrameCopy: Frame = newMessage.get().copy();
        newMessage.set(initialFrameCopy);

        newMessage.setCorrelationId(correlationId);

        newMessage.retryable = this.retryable;
        newMessage.acquiresResource = this.acquiresResource;
        newMessage.operationName = this.operationName;

        return newMessage;
    }

    public set(element: Frame): ClientMessage {
        const newMessage: ClientMessage = new ClientMessage(element);
        return newMessage;
    }

    public equals(o: ClientMessage): boolean {
        if (o === null) {
            return false;
        }

        const message: ClientMessage = o;

        if (this.isRetryable !== message.isRetryable) {
            return false;
        }
        if (this.acquiresResource !== message.acquiresResource) {
            return false;
        }
        if (!(this.operationName === message.operationName)) {
            return false;
        }
        return (this.connection === message.connection);
    }

}
