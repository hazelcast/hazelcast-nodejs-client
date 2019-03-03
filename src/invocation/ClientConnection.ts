/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
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

import * as Promise from 'bluebird';
import * as net from 'net';
import {BitsUtil} from '../BitsUtil';
import {BuildInfo} from '../BuildInfo';
import HazelcastClient from '../HazelcastClient';
import {IOError} from '../HazelcastError';
import Address = require('../Address');
import {DeferredPromise} from '../Util';

export class ClientConnection {
    private address: Address;
    private readonly localAddress: Address;
    private lastReadTimeMillis: number;
    private lastWriteTimeMillis: number;
    private heartbeating = true;
    private client: HazelcastClient;
    private readBuffer: Buffer;
    private readonly startTime: number = Date.now();
    private closedTime: number;
    private connectedServerVersionString: string;
    private connectedServerVersion: number;
    private authenticatedAsOwner: boolean;
    private socket: net.Socket;

    constructor(client: HazelcastClient, address: Address, socket: net.Socket) {
        this.client = client;
        this.socket = socket;
        this.address = address;
        this.localAddress = new Address(socket.localAddress, socket.localPort);
        this.readBuffer = new Buffer(0);
        this.lastReadTimeMillis = 0;
        this.closedTime = 0;
        this.connectedServerVersionString = null;
        this.connectedServerVersion = BuildInfo.UNKNOWN_VERSION_ID;
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
        try {
            this.socket.write(buffer, (err: any) => {
                if (err) {
                    deferred.reject(new IOError(err));
                } else {
                    this.lastWriteTimeMillis = Date.now();
                    deferred.resolve();
                }
            });
        } catch (err) {
            deferred.reject(new IOError(err));
        }
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
            this.lastReadTimeMillis = new Date().getTime();
            this.readBuffer = Buffer.concat([this.readBuffer, buffer], this.readBuffer.length + buffer.length);
            while (this.readBuffer.length >= BitsUtil.INT_SIZE_IN_BYTES) {
                const frameSize = this.readBuffer.readInt32LE(0);
                if (frameSize > this.readBuffer.length) {
                    return;
                }
                const message: Buffer = new Buffer(frameSize);
                this.readBuffer.copy(message, 0, 0, frameSize);
                this.readBuffer = this.readBuffer.slice(frameSize);
                callback(message);
            }
        });
        this.socket.on('error', (e: any) => {
            if (e.code === 'EPIPE' || e.code === 'ECONNRESET') {
                this.client.getConnectionManager().destroyConnection(this.address);
            }
        });
    }
}
