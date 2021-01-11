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
/** @ignore *//** */

import * as net from 'net';
import {EventEmitter} from 'events';
import {BitsUtil} from '../util/BitsUtil';
import {BuildInfo} from '../BuildInfo';
import {HazelcastClient} from '../HazelcastClient';
import {AddressImpl, IOError, UUID} from '../core';
import {ClientMessageHandler} from '../protocol/ClientMessage';
import {deferredPromise, DeferredPromise} from '../util/Util';
import {ILogger} from '../logging/ILogger';
import {
    ClientMessage,
    Frame,
    SIZE_OF_FRAME_LENGTH_AND_FLAGS
} from '../protocol/ClientMessage';

const FROZEN_ARRAY = Object.freeze([]) as OutputQueueItem[];
const PROPERTY_PIPELINING_ENABLED = 'hazelcast.client.autopipelining.enabled';
const PROPERTY_PIPELINING_THRESHOLD = 'hazelcast.client.autopipelining.threshold.bytes';
const PROPERTY_NO_DELAY = 'hazelcast.client.socket.no.delay';

abstract class Writer extends EventEmitter {

    abstract write(message: ClientMessage, resolver: DeferredPromise<void>): void;

    abstract close(): void;

}

interface OutputQueueItem {

    message: ClientMessage;

    resolver: DeferredPromise<void>;

}

/** @internal */
export class PipelinedWriter extends Writer {

    private readonly socket: net.Socket;
    private queue: OutputQueueItem[] = [];
    private error: Error;
    private scheduled = false;
    private canWrite = true;
    // coalescing threshold in bytes
    private readonly threshold: number;
    // reusable buffer for coalescing
    private readonly coalesceBuf: Buffer;

    constructor(socket: net.Socket, threshold: number) {
        super();
        this.socket = socket;
        this.threshold = threshold;
        this.coalesceBuf = Buffer.allocUnsafe(threshold);

        // write queued items on drain event
        socket.on('drain', () => {
            this.canWrite = true;
            this.schedule();
        });
    }

    write(message: ClientMessage, resolver: DeferredPromise<void>): void {
        if (this.error) {
            // if there was a write error, it's useless to keep writing to the socket
            return process.nextTick(() => resolver.reject(this.error));
        }
        this.queue.push({ message, resolver });
        this.schedule();
    }

    close(): void {
        this.canWrite = false;
        // no more items can be added now
        this.queue = FROZEN_ARRAY;
    }

    private schedule(): void {
        if (!this.scheduled && this.canWrite) {
            this.scheduled = true;
            // nextTick allows queue to be processed on the current event loop phase
            process.nextTick(() => this.process());
        }
    }

    private process(): void {
        if (this.error) {
            return;
        }

        let totalLength = 0;
        let queueIdx = 0;
        while (queueIdx < this.queue.length && totalLength < this.threshold) {
            const msg = this.queue[queueIdx].message;
            const msgLength = msg.getTotalLength();
            // if the next buffer exceeds the threshold,
            // try to take multiple queued buffers which fit this.coalesceBuf
            if (queueIdx > 0 && totalLength + msgLength > this.threshold) {
                break;
            }
            totalLength += msgLength;
            queueIdx++;
        }

        if (totalLength === 0) {
            this.scheduled = false;
            return;
        }

        const writeBatch = this.queue.slice(0, queueIdx);
        this.queue = this.queue.slice(queueIdx);

        let buf;
        if (writeBatch.length === 1 && totalLength > this.threshold) {
            // take the only large message
            buf = writeBatch[0].message.toBuffer();
        } else {
            // coalesce buffers
            let pos = 0;
            for (const item of writeBatch) {
                pos = item.message.writeTo(this.coalesceBuf, pos);
            }
            buf = this.coalesceBuf.slice(0, totalLength);
        }

        // write to the socket: no further writes until flushed
        this.canWrite = this.socket.write(buf, (err: Error) => {
            if (err) {
                this.handleError(err, writeBatch);
                return;
            }

            this.emit('write');
            for (const item of writeBatch) {
                item.resolver.resolve();
            }
            if (this.queue.length === 0 || !this.canWrite) {
                // will start running on the next message or drain event
                this.scheduled = false;
                return;
            }
            // setImmediate allows I/O between writes
            setImmediate(() => this.process());
        });
    }

    private handleError(err: any, sentResolvers: OutputQueueItem[]): void {
        this.error = new IOError(err);
        for (const item of sentResolvers) {
            item.resolver.reject(this.error);
        }
        for (const item of this.queue) {
            item.resolver.reject(this.error);
        }
        this.close();
    }
}

/** @internal */
export class DirectWriter extends Writer {

    private readonly socket: net.Socket;

    constructor(socket: net.Socket) {
        super();
        this.socket = socket;
    }

    write(message: ClientMessage, resolver: DeferredPromise<void>): void {
        const buffer = message.toBuffer();
        this.socket.write(buffer, (err: any) => {
            if (err) {
                resolver.reject(new IOError(err));
                return;
            }
            this.emit('write');
            resolver.resolve();
        });
    }

    close(): void {
        // no-op
    }
}

/** @internal */
export class ClientMessageReader {

    private chunks: Buffer[] = [];
    private chunksTotalSize = 0;
    private frameSize = 0;
    private flags = 0;
    private clientMessage: ClientMessage = null;

    append(buffer: Buffer): void {
        this.chunksTotalSize += buffer.length;
        this.chunks.push(buffer);
    }

    read(): ClientMessage {
        for (;;) {
            if (this.readFrame()) {
                if (this.clientMessage.endFrame.isFinalFrame()) {
                    const message = this.clientMessage;
                    this.reset();
                    return message;
                }
            } else {
                return null;
            }
        }
    }

    readFrame(): boolean {
        if (this.chunksTotalSize < SIZE_OF_FRAME_LENGTH_AND_FLAGS) {
            // we don't have even the frame length and flags ready
            return false;
        }
        if (this.frameSize === 0) {
            this.readFrameSizeAndFlags();
        }
        if (this.chunksTotalSize < this.frameSize) {
            return false;
        }

        let buf = this.chunks.length === 1 ? this.chunks[0] : Buffer.concat(this.chunks, this.chunksTotalSize);
        if (this.chunksTotalSize > this.frameSize) {
            if (this.chunks.length === 1) {
                this.chunks[0] = buf.slice(this.frameSize);
            } else {
                this.chunks = [buf.slice(this.frameSize)];
            }
            buf = buf.slice(SIZE_OF_FRAME_LENGTH_AND_FLAGS, this.frameSize);
        } else {
            this.chunks = [];
            buf = buf.slice(SIZE_OF_FRAME_LENGTH_AND_FLAGS);
        }
        this.chunksTotalSize -= this.frameSize;
        this.frameSize = 0;
        // No need to reset flags since it will be overwritten on the next readFrameSizeAndFlags call.
        const frame = new Frame(buf, this.flags);
        if (this.clientMessage == null) {
            this.clientMessage = ClientMessage.createForDecode(frame);
        } else {
            this.clientMessage.addFrame(frame);
        }
        return true;
    }

    private reset(): void {
        this.clientMessage = null;
    }

    private readFrameSizeAndFlags(): void {
        if (this.chunks[0].length >= SIZE_OF_FRAME_LENGTH_AND_FLAGS) {
            this.frameSize = this.chunks[0].readInt32LE(0);
            this.flags = this.chunks[0].readUInt16LE(BitsUtil.INT_SIZE_IN_BYTES);
            return;
        }
        let readChunksSize = 0;
        for (let i = 0; i < this.chunks.length; i++) {
            readChunksSize += this.chunks[i].length;
            if (readChunksSize >= SIZE_OF_FRAME_LENGTH_AND_FLAGS) {
                const merged = Buffer.concat(this.chunks.slice(0, i + 1), readChunksSize);
                this.frameSize = merged.readInt32LE(0);
                this.flags = merged.readUInt16LE(BitsUtil.INT_SIZE_IN_BYTES);
                return;
            }
        }
        throw new Error('Detected illegal internal call in ClientMessageReader!');
    }
}

/** @internal */
export class FragmentedClientMessageHandler {
    private readonly fragmentedMessages = new Map<number, ClientMessage>();
    private readonly logger: ILogger;

    constructor(logger: ILogger) {
        this.logger = logger;
    }

    handleFragmentedMessage(clientMessage: ClientMessage, callback: ClientMessageHandler): void {
        const fragmentationFrame = clientMessage.startFrame;
        const fragmentationId = clientMessage.getFragmentationId();
        clientMessage.dropFragmentationFrame();
        if (fragmentationFrame.hasBeginFragmentFlag()) {
            this.fragmentedMessages.set(fragmentationId, clientMessage);
        } else {
            const existingMessage = this.fragmentedMessages.get(fragmentationId);
            if (existingMessage == null) {
                this.logger.debug('FragmentedClientMessageHandler',
                    'A fragmented message without the begin part is received. Fragmentation id: ' + fragmentationId);
                return;
            }

            existingMessage.merge(clientMessage);
            if (fragmentationFrame.hasEndFragmentFlag()) {
                this.fragmentedMessages.delete(fragmentationId);
                callback(existingMessage);
            }
        }
    }
}

/** @internal */
export class ClientConnection {

    private readonly connectionId: number;
    private remoteAddress: AddressImpl;
    private remoteUuid: UUID;
    private readonly localAddress: AddressImpl;
    private lastReadTimeMillis: number;
    private lastWriteTimeMillis: number;
    private readonly client: HazelcastClient;
    private readonly startTime: number = Date.now();
    private closedTime: number;
    private closedReason: string;
    private closedCause: Error;
    private connectedServerVersion: number;
    private readonly socket: net.Socket;
    private readonly writer: Writer;
    private readonly reader: ClientMessageReader;
    private readonly logger: ILogger;
    private readonly fragmentedMessageHandler: FragmentedClientMessageHandler;

    constructor(client: HazelcastClient, remoteAddress: AddressImpl, socket: net.Socket, connectionId: number) {
        const enablePipelining = client.getConfig().properties[PROPERTY_PIPELINING_ENABLED] as boolean;
        const pipeliningThreshold = client.getConfig().properties[PROPERTY_PIPELINING_THRESHOLD] as number;
        const noDelay = client.getConfig().properties[PROPERTY_NO_DELAY] as boolean;
        socket.setNoDelay(noDelay);

        this.client = client;
        this.socket = socket;
        this.remoteAddress = remoteAddress;
        this.localAddress = new AddressImpl(socket.localAddress, socket.localPort);
        this.lastReadTimeMillis = 0;
        this.closedTime = 0;
        this.connectedServerVersion = BuildInfo.UNKNOWN_VERSION_ID;
        this.writer = enablePipelining ? new PipelinedWriter(socket, pipeliningThreshold) : new DirectWriter(socket);
        this.writer.on('write', () => {
            this.lastWriteTimeMillis = Date.now();
        });
        this.reader = new ClientMessageReader();
        this.connectionId = connectionId;
        this.logger = this.client.getLoggingService().getLogger();
        this.fragmentedMessageHandler = new FragmentedClientMessageHandler(this.logger);
    }

    /**
     * Returns the address of local port that is associated with this connection.
     * @returns
     */
    getLocalAddress(): AddressImpl {
        return this.localAddress;
    }

    /**
     * Returns the address of remote node that is associated with this connection.
     * @returns
     */
    getRemoteAddress(): AddressImpl {
        return this.remoteAddress;
    }

    setRemoteAddress(address: AddressImpl): void {
        this.remoteAddress = address;
    }

    getRemoteUuid(): UUID {
        return this.remoteUuid;
    }

    setRemoteUuid(remoteUuid: UUID): void {
        this.remoteUuid = remoteUuid;
    }

    write(message: ClientMessage): Promise<void> {
        const deferred = deferredPromise<void>();
        this.writer.write(message, deferred);
        return deferred.promise;
    }

    setConnectedServerVersion(versionString: string): void {
        this.connectedServerVersion = BuildInfo.calculateServerVersionFromString(versionString);
    }

    getConnectedServerVersion(): number {
        return this.connectedServerVersion;
    }

    /**
     * Closes this connection.
     */
    close(reason: string, cause: Error): void {
        if (this.closedTime !== 0) {
            return;
        }
        this.closedTime = Date.now();

        this.closedCause = cause;
        this.closedReason = reason;

        this.logClose();

        this.writer.close();
        this.socket.end();

        this.client.getConnectionManager().onConnectionClose(this);
    }

    isAlive(): boolean {
        return this.closedTime === 0;
    }

    getClosedReason(): string {
        return this.closedReason;
    }

    getStartTime(): number {
        return this.startTime;
    }

    getLastReadTimeMillis(): number {
        return this.lastReadTimeMillis;
    }

    getLastWriteTimeMillis(): number {
        return this.lastWriteTimeMillis;
    }

    equals(other: ClientConnection): boolean {
        if (other == null) {
            return false;
        }

        return this.connectionId === other.connectionId;
    }

    toString(): string {
        return 'ClientConnection{'
            + 'alive=' + this.isAlive()
            + ', connectionId=' + this.connectionId
            + ', remoteAddress=' + this.remoteAddress
            + '}';
    }

    /**
     * Registers a function to pass received data on 'data' events on this connection.
     * @param callback
     */
    registerResponseCallback(callback: ClientMessageHandler): void {
        this.socket.on('data', (buffer: Buffer) => {
            this.lastReadTimeMillis = Date.now();
            this.reader.append(buffer);
            let clientMessage = this.reader.read();
            while (clientMessage !== null) {
                if (clientMessage.startFrame.hasUnfragmentedMessageFlag()) {
                    callback(clientMessage);
                } else {
                    this.fragmentedMessageHandler.handleFragmentedMessage(clientMessage, callback);
                }
                clientMessage = this.reader.read();
            }
        });
    }

    private logClose(): void {
        let message = this.toString() + ' closed. Reason: ';
        if (this.closedReason != null) {
            message += this.closedReason;
        } else {
            message += 'Socket explicitly closed';
        }

        if (this.closedCause != null) {
            message += ' - ';
            const cause = this.closedCause as NodeJS.ErrnoException;
            if (cause.code != null) {
                message += cause.code + ': ';
            }
            message += cause.message;
        }

        if (this.client.getLifecycleService().isRunning()) {
            if (this.closedCause == null) {
                this.logger.info('Connection', message);
            } else {
                this.logger.warn('Connection', message);
            }
        } else {
            this.logger.trace('Connection', message);
        }
    }
}
