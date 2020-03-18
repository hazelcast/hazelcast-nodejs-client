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
import Address = require('../Address');
import {DeferredPromise} from '../Util';

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

export class FrameReader {

    private chunks: Buffer[] = [];
    private chunksTotalSize: number = 0;
    private frameSize: number = 0;

    append(buffer: Buffer): void {
        this.chunksTotalSize += buffer.length;
        this.chunks.push(buffer);
    }

    read(): Buffer {
        if (this.chunksTotalSize < BitsUtil.INT_SIZE_IN_BYTES) {
            return null;
        }
        if (this.frameSize === 0) {
            this.frameSize = this.readFrameSize();
        }
        if (this.chunksTotalSize < this.frameSize) {
            return null;
        }

        let frame = this.chunks.length === 1 ? this.chunks[0] : Buffer.concat(this.chunks, this.chunksTotalSize);
        if (this.chunksTotalSize > this.frameSize) {
            if (this.chunks.length === 1) {
                this.chunks[0] = frame.slice(this.frameSize);
            } else {
                this.chunks = [frame.slice(this.frameSize)];
            }
            frame = frame.slice(0, this.frameSize);
        } else {
            this.chunks = [];
        }
        this.chunksTotalSize -= this.frameSize;
        this.frameSize = 0;
        return frame;
    }

    private readFrameSize(): number {
        if (this.chunks[0].length >= BitsUtil.INT_SIZE_IN_BYTES) {
            return this.chunks[0].readInt32LE(0);
        }
        let readChunksSize = 0;
        for (let i = 0; i < this.chunks.length; i++) {
            readChunksSize += this.chunks[i].length;
            if (readChunksSize >= BitsUtil.INT_SIZE_IN_BYTES) {
                const merged = Buffer.concat(this.chunks.slice(0, i + 1), readChunksSize);
                return merged.readInt32LE(0);
            }
        }
        throw new Error('Detected illegal internal call in FrameReader!');
    }
}

export class ClientConnection {
    private address: Address;
    private readonly localAddress: Address;
    private lastReadTimeMillis: number;
    private lastWriteTimeMillis: number;
    private heartbeating = true;
    private readonly client: HazelcastClient;
    private readonly startTime: number = Date.now();
    private closedTime: number;
    private connectedServerVersionString: string;
    private connectedServerVersion: number;
    private authenticatedAsOwner: boolean;
    private readonly socket: net.Socket;
    private readonly writer: PipelinedWriter | DirectWriter;
    private readonly reader: FrameReader;

    constructor(client: HazelcastClient, address: Address, socket: net.Socket) {
        const enablePipelining = client.getConfig().properties[PROPERTY_PIPELINING_ENABLED] as boolean;
        const pipeliningThreshold = client.getConfig().properties[PROPERTY_PIPELINING_THRESHOLD] as number;
        const noDelay = client.getConfig().properties[PROPERTY_NO_DELAY] as boolean;
        socket.setNoDelay(noDelay);

        this.client = client;
        this.socket = socket;
        this.address = address;
        this.localAddress = new Address(socket.localAddress, socket.localPort);
        this.lastReadTimeMillis = 0;
        this.closedTime = 0;
        this.connectedServerVersionString = null;
        this.connectedServerVersion = BuildInfo.UNKNOWN_VERSION_ID;
        this.writer = enablePipelining ? new PipelinedWriter(socket, pipeliningThreshold) : new DirectWriter(socket);
        this.writer.on('write', () => {
            this.lastWriteTimeMillis = Date.now();
        });
        this.reader = new FrameReader();
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
    getAddress(): Address {
        return this.address;
    }

    setAddress(address: Address): void {
        this.address = address;
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
    close(): void {
        this.socket.end();
        this.closedTime = Date.now();
    }

    isAlive(): boolean {
        return this.closedTime === 0;
    }

    isHeartbeating(): boolean {
        return this.heartbeating;
    }

    setHeartbeating(heartbeating: boolean): void {
        this.heartbeating = heartbeating;
    }

    isAuthenticatedAsOwner(): boolean {
        return this.authenticatedAsOwner;
    }

    setAuthenticatedAsOwner(asOwner: boolean): void {
        this.authenticatedAsOwner = asOwner;
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

    toString(): string {
        return this.address.toString();
    }

    /**
     * Registers a function to pass received data on 'data' events on this connection.
     * @param callback
     */
    registerResponseCallback(callback: Function): void {
        this.socket.on('data', (buffer: Buffer) => {
            this.lastReadTimeMillis = Date.now();
            this.reader.append(buffer);
            let frame = this.reader.read();
            while (frame !== null) {
                callback(frame);
                frame = this.reader.read();
            }
        });
        this.socket.on('error', (e: any) => {
            if (e.code === 'EPIPE' || e.code === 'ECONNRESET') {
                this.client.getConnectionManager().destroyConnection(this.address);
            }
        });
    }
}
