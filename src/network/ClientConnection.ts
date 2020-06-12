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

import {Buffer} from 'safe-buffer';
import * as Promise from 'bluebird';
import * as net from 'net';
import {EventEmitter} from 'events';
import {BitsUtil} from '../BitsUtil';
import {BuildInfo} from '../BuildInfo';
import HazelcastClient from '../HazelcastClient';
import {IOError} from '../HazelcastError';
import {DeferredPromise} from '../Util';
import {Address} from '../Address';
import {UUID} from '../core/UUID';
import {ILogger} from '../logging/ILogger';
import {ClientMessage, Frame, SIZE_OF_FRAME_LENGTH_AND_FLAGS} from '../ClientMessage';

const FROZEN_ARRAY = Object.freeze([]) as OutputQueueItem[];
const PROPERTY_PIPELINING_ENABLED = 'hazelcast.client.autopipelining.enabled';
const PROPERTY_PIPELINING_THRESHOLD = 'hazelcast.client.autopipelining.threshold.bytes';
const PROPERTY_NO_DELAY = 'hazelcast.client.socket.no.delay';

interface OutputQueueItem {
    buffer: Buffer;
    resolver: Promise.Resolver<void>;
}

export class PipelinedWriter extends EventEmitter {

    private readonly socket: net.Socket;
    private queue: OutputQueueItem[] = [];
    private error: Error;
    private scheduled: boolean = false;
    // coalescing threshold in bytes
    private readonly threshold: number;

    constructor(socket: net.Socket, threshold: number) {
        super();
        this.socket = socket;
        this.threshold = threshold;
    }

    write(buffer: Buffer, resolver: Promise.Resolver<void>): void {
        if (this.error) {
            // if there was a write error, it's useless to keep writing to the socket
            return process.nextTick(() => resolver.reject(this.error));
        }
        this.queue.push({ buffer, resolver });
        this.schedule();
    }

    private schedule(): void {
        if (!this.scheduled) {
            this.scheduled = true;
            // nextTick allows queue to be processed on the current event loop phase
            process.nextTick(() => this.process());
        }
    }

    private process(): void {
        if (this.error) {
            return;
        }

        const buffers: Buffer[] = [];
        const resolvers: Array<Promise.Resolver<void>> = [];
        let totalLength = 0;

        while (this.queue.length > 0 && totalLength < this.threshold) {
            const item = this.queue.shift();
            const data = item.buffer;
            totalLength += data.length;
            buffers.push(data);
            resolvers.push(item.resolver);
        }

        if (totalLength === 0) {
            this.scheduled = false;
            return;
        }

        // coalesce buffers and write to the socket: no further writes until flushed
        const merged = buffers.length === 1 ? buffers[0] : Buffer.concat(buffers, totalLength);
        this.socket.write(merged as any, (err: Error) => {
            if (err) {
                this.handleError(err, resolvers);
                return;
            }

            this.emit('write');
            for (const r of resolvers) {
                r.resolve();
            }
            if (this.queue.length === 0) {
                // will start running on the next message
                this.scheduled = false;
                return;
            }
            // setImmediate allows IO between writes
            setImmediate(() => this.process());
        });
    }

    private handleError(err: any, sentResolvers: Array<Promise.Resolver<void>>): void {
        this.error = new IOError(err);
        for (const r of sentResolvers) {
            r.reject(this.error);
        }
        // no more items can be added now
        const q = this.queue;
        this.queue = FROZEN_ARRAY;
        for (const it of q) {
            it.resolver.reject(this.error);
        }
    }
}

export class DirectWriter extends EventEmitter {

    private readonly socket: net.Socket;

    constructor(socket: net.Socket) {
        super();
        this.socket = socket;
    }

    write(buffer: Buffer, resolver: Promise.Resolver<void>): void {
        this.socket.write(buffer as any, (err: any) => {
            if (err) {
                resolver.reject(new IOError(err));
                return;
            }
            this.emit('write');
            resolver.resolve();
        });
    }
}

export class ClientMessageReader {

    private chunks: Buffer[] = [];
    private chunksTotalSize: number = 0;
    private frameSize: number = 0;
    private flags: number = 0;
    private clientMessage: ClientMessage = null;

    append(buffer: Buffer): void {
        this.chunksTotalSize += buffer.length;
        this.chunks.push(buffer);
    }

    read(): ClientMessage {
        while (true) {
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

class ClientMessageDecoder {
    private readonly incompleteMessages = new Map<number, ClientMessage>();

    handleFragmentedMessage(clientMessage: ClientMessage, callback: Function): void {
        const fragmentationId = clientMessage.getFragmentationId();
        if (clientMessage.startFrame.hasBeginFragmentFlag()) {
            // Ignore the fragmentation frame
            clientMessage.nextFrame();
            const startFrame = clientMessage.nextFrame();
            this.incompleteMessages.set(fragmentationId, ClientMessage.createForDecode(startFrame));
        } else if (clientMessage.startFrame.hasEndFragmentFlag()) {
            const mergedMessage = this.mergeIntoExistingClientMessage(fragmentationId, clientMessage);
            callback(mergedMessage);
        } else {
            this.mergeIntoExistingClientMessage(fragmentationId, clientMessage);
        }
    }

    private mergeIntoExistingClientMessage(fragmentationId: number, clientMessage: ClientMessage): ClientMessage {
        const existingMessage = this.incompleteMessages.get(fragmentationId);
        existingMessage.merge(clientMessage);
        return existingMessage;
    }
}

export class ClientConnection {
    private readonly connectionId: number;
    private remoteAddress: Address;
    private remoteUuid: UUID;
    private readonly localAddress: Address;
    private lastReadTimeMillis: number;
    private lastWriteTimeMillis: number;
    private readonly client: HazelcastClient;
    private readonly startTime: number = Date.now();
    private closedTime: number;
    private closedReason: string;
    private closedCause: Error;
    private connectedServerVersionString: string;
    private connectedServerVersion: number;
    private readonly socket: net.Socket;
    private readonly writer: PipelinedWriter | DirectWriter;
    private readonly reader: ClientMessageReader;
    private readonly logger: ILogger;
    private readonly decoder: ClientMessageDecoder;

    constructor(client: HazelcastClient, remoteAddress: Address, socket: net.Socket, connectionId: number) {
        const enablePipelining = client.getConfig().properties[PROPERTY_PIPELINING_ENABLED] as boolean;
        const pipeliningThreshold = client.getConfig().properties[PROPERTY_PIPELINING_THRESHOLD] as number;
        const noDelay = client.getConfig().properties[PROPERTY_NO_DELAY] as boolean;
        socket.setNoDelay(noDelay);

        this.client = client;
        this.socket = socket;
        this.remoteAddress = remoteAddress;
        this.localAddress = new Address(socket.localAddress, socket.localPort);
        this.lastReadTimeMillis = 0;
        this.closedTime = 0;
        this.connectedServerVersionString = null;
        this.connectedServerVersion = BuildInfo.UNKNOWN_VERSION_ID;
        this.writer = enablePipelining ? new PipelinedWriter(socket, pipeliningThreshold) : new DirectWriter(socket);
        this.writer.on('write', () => {
            this.lastWriteTimeMillis = Date.now();
        });
        this.reader = new ClientMessageReader();
        this.connectionId = connectionId;
        this.logger = this.client.getLoggingService().getLogger();
        this.decoder = new ClientMessageDecoder();
    }

    /**
     * Returns the address of local port that is associated with this connection.
     * @returns
     */
    getLocalAddress(): Address {
        return this.localAddress;
    }

    /**
     * Returns the address of remote node that is associated with this connection.
     * @returns
     */
    getRemoteAddress(): Address {
        return this.remoteAddress;
    }

    setRemoteAddress(address: Address): void {
        this.remoteAddress = address;
    }

    getRemoteUuid(): UUID {
        return this.remoteUuid;
    }

    setRemoteUuid(remoteUuid: UUID): void {
        this.remoteUuid = remoteUuid;
    }

    write(buffer: Buffer): Promise<void> {
        const deferred = DeferredPromise<void>();
        this.writer.write(buffer, deferred);
        return deferred.promise;
    }

    setConnectedServerVersion(versionString: string): void {
        this.connectedServerVersionString = versionString;
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

        this.socket.end();

        this.client.getConnectionManager().onConnectionClose(this);
    }

    isAlive(): boolean {
        return this.closedTime === 0;
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
    registerResponseCallback(callback: Function): void {
        this.socket.on('data', (buffer: Buffer) => {
            this.lastReadTimeMillis = Date.now();
            this.reader.append(buffer);
            let clientMessage = this.reader.read();
            while (clientMessage !== null) {
                if (clientMessage.startFrame.hasUnfragmentedMessageFlag()) {
                    callback(clientMessage);
                } else {
                    this.decoder.handleFragmentedMessage(clientMessage, callback);
                }
                clientMessage = this.reader.read();
            }
        });
    }

    private logClose(): void {
        let message = this.toString() + ' closed. Reason: ';
        if (this.closedReason != null) {
            message += this.closedReason;
        } else if (this.closedCause != null) {
            message += this.closedCause.name + '[' + this.closedCause.message + ']';
        } else {
            message += 'Socket explicitly closed';
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
