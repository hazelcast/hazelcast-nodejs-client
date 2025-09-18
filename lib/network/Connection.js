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
exports.Connection = exports.FragmentedClientMessageHandler = exports.ClientMessageReader = exports.DirectWriter = exports.PipelinedWriter = void 0;
const events_1 = require("events");
const BitsUtil_1 = require("../util/BitsUtil");
const BuildInfo_1 = require("../BuildInfo");
const core_1 = require("../core");
const Util_1 = require("../util/Util");
const ClientMessage_1 = require("../protocol/ClientMessage");
const FROZEN_ARRAY = Object.freeze([]);
const PROPERTY_PIPELINING_ENABLED = 'hazelcast.client.autopipelining.enabled';
const PROPERTY_PIPELINING_THRESHOLD = 'hazelcast.client.autopipelining.threshold.bytes';
const PROPERTY_NO_DELAY = 'hazelcast.client.socket.no.delay';
class Writer extends events_1.EventEmitter {
}
/** @internal */
class PipelinedWriter extends Writer {
    constructor(socket, 
    // coalescing threshold in bytes
    threshold, incrementBytesWrittenFn) {
        super();
        this.socket = socket;
        this.threshold = threshold;
        this.incrementBytesWrittenFn = incrementBytesWrittenFn;
        this.queue = [];
        this.scheduled = false;
        this.canWrite = true;
        this.coalesceBuf = Buffer.allocUnsafe(threshold);
        // write queued items on drain event
        socket.on('drain', () => {
            this.canWrite = true;
            this.schedule();
        });
    }
    write(message, resolver) {
        if (this.error) {
            // if the socket is closed, it's useless to keep writing to the socket
            return process.nextTick(() => resolver.reject(this.error));
        }
        this.queue.push({ message, resolver });
        this.schedule();
    }
    close(error) {
        if (this.error) {
            return;
        }
        this.error = this.makeIOError(error);
        this.canWrite = false;
        // If we pass an error to destroy, an unhandled error will be thrown because we don't handle the error event
        // So we don't pass anything to the socket. It is internal anyway.
        this.socket.destroy();
        // no more items can be added now
        this.queue = FROZEN_ARRAY;
    }
    schedule() {
        if (!this.scheduled && this.canWrite) {
            this.scheduled = true;
            // nextTick allows queue to be processed on the current event loop phase
            process.nextTick(() => this.process());
        }
    }
    process() {
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
        }
        else {
            // coalesce buffers
            let pos = 0;
            for (const item of writeBatch) {
                pos = item.message.writeTo(this.coalesceBuf, pos);
            }
            buf = this.coalesceBuf.slice(0, totalLength);
        }
        // write to the socket: no further writes until flushed
        this.canWrite = this.socket.write(buf, (err) => {
            if (err) {
                this.handleError(err, writeBatch);
                return;
            }
            this.emit('write');
            this.incrementBytesWrittenFn(buf.length);
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
    handleError(err, sentResolvers) {
        const error = this.makeIOError(err);
        for (const item of sentResolvers) {
            item.resolver.reject(error);
        }
        for (const item of this.queue) {
            item.resolver.reject(error);
        }
        this.close(error);
    }
    makeIOError(err) {
        if (err instanceof core_1.IOError) {
            return err;
        }
        return new core_1.IOError(err.message, err);
    }
}
exports.PipelinedWriter = PipelinedWriter;
/** @internal */
class DirectWriter extends Writer {
    constructor(socket, incrementBytesWrittenFn) {
        super();
        this.socket = socket;
        this.incrementBytesWrittenFn = incrementBytesWrittenFn;
    }
    write(message, resolver) {
        const buffer = message.toBuffer();
        this.socket.write(buffer, (err) => {
            if (err) {
                resolver.reject(new core_1.IOError(err));
                return;
            }
            this.emit('write');
            this.incrementBytesWrittenFn(buffer.length);
            resolver.resolve();
        });
    }
    close(cause) {
        this.socket.destroy();
    }
}
exports.DirectWriter = DirectWriter;
/** @internal */
class ClientMessageReader {
    constructor() {
        this.chunks = [];
        this.chunksTotalSize = 0;
        this.frameSize = 0;
        this.flags = 0;
        this.clientMessage = null;
    }
    append(buffer) {
        this.chunksTotalSize += buffer.length;
        this.chunks.push(buffer);
    }
    read() {
        for (;;) {
            if (this.readFrame()) {
                if (this.clientMessage.endFrame.isFinalFrame()) {
                    const message = this.clientMessage;
                    this.reset();
                    return message;
                }
            }
            else {
                return null;
            }
        }
    }
    readFrame() {
        if (this.chunksTotalSize < ClientMessage_1.SIZE_OF_FRAME_LENGTH_AND_FLAGS) {
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
            }
            else {
                this.chunks = [buf.slice(this.frameSize)];
            }
            buf = buf.slice(ClientMessage_1.SIZE_OF_FRAME_LENGTH_AND_FLAGS, this.frameSize);
        }
        else {
            this.chunks = [];
            buf = buf.slice(ClientMessage_1.SIZE_OF_FRAME_LENGTH_AND_FLAGS);
        }
        this.chunksTotalSize -= this.frameSize;
        this.frameSize = 0;
        // No need to reset flags since it will be overwritten on the next readFrameSizeAndFlags call.
        const frame = new ClientMessage_1.Frame(buf, this.flags);
        if (this.clientMessage == null) {
            this.clientMessage = ClientMessage_1.ClientMessage.createForDecode(frame);
        }
        else {
            this.clientMessage.addFrame(frame);
        }
        return true;
    }
    reset() {
        this.clientMessage = null;
    }
    readFrameSizeAndFlags() {
        if (this.chunks[0].length >= ClientMessage_1.SIZE_OF_FRAME_LENGTH_AND_FLAGS) {
            this.frameSize = this.chunks[0].readInt32LE(0);
            this.flags = this.chunks[0].readUInt16LE(BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES);
            return;
        }
        let readChunksSize = 0;
        for (let i = 0; i < this.chunks.length; i++) {
            readChunksSize += this.chunks[i].length;
            if (readChunksSize >= ClientMessage_1.SIZE_OF_FRAME_LENGTH_AND_FLAGS) {
                const merged = Buffer.concat(this.chunks.slice(0, i + 1), readChunksSize);
                this.frameSize = merged.readInt32LE(0);
                this.flags = merged.readUInt16LE(BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES);
                return;
            }
        }
        throw new Error('Detected illegal internal call in ClientMessageReader!');
    }
}
exports.ClientMessageReader = ClientMessageReader;
/** @internal */
class FragmentedClientMessageHandler {
    constructor(logger) {
        this.logger = logger;
        this.fragmentedMessages = new Map();
    }
    handleFragmentedMessage(clientMessage, callback) {
        const fragmentationFrame = clientMessage.startFrame;
        const fragmentationId = clientMessage.getFragmentationId();
        clientMessage.dropFragmentationFrame();
        if (fragmentationFrame.hasBeginFragmentFlag()) {
            this.fragmentedMessages.set(fragmentationId, clientMessage);
        }
        else {
            const existingMessage = this.fragmentedMessages.get(fragmentationId);
            if (existingMessage == null) {
                this.logger.debug('FragmentedClientMessageHandler', 'A fragmented message without the begin part is received. Fragmentation id: ' + fragmentationId);
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
exports.FragmentedClientMessageHandler = FragmentedClientMessageHandler;
/** @internal */
class Connection {
    constructor(connectionManager, clientConfig, logger, remoteAddress, socket, connectionId, lifecycleService, incrementBytesReadFn, incrementBytesWrittenFn) {
        this.connectionManager = connectionManager;
        this.logger = logger;
        this.remoteAddress = remoteAddress;
        this.socket = socket;
        this.connectionId = connectionId;
        this.lifecycleService = lifecycleService;
        this.incrementBytesReadFn = incrementBytesReadFn;
        this.incrementBytesWrittenFn = incrementBytesWrittenFn;
        this.startTime = Date.now();
        const enablePipelining = clientConfig.properties[PROPERTY_PIPELINING_ENABLED];
        const pipeliningThreshold = clientConfig.properties[PROPERTY_PIPELINING_THRESHOLD];
        const noDelay = clientConfig.properties[PROPERTY_NO_DELAY];
        this.socket.setNoDelay(noDelay);
        this.localAddress = new core_1.AddressImpl(this.socket.localAddress, this.socket.localPort);
        this.lastReadTimeMillis = 0;
        this.closedTime = 0;
        this.connectedServerVersion = BuildInfo_1.BuildInfo.UNKNOWN_VERSION_ID;
        this.writer = enablePipelining ? new PipelinedWriter(this.socket, pipeliningThreshold, this.incrementBytesWrittenFn)
            : new DirectWriter(this.socket, this.incrementBytesWrittenFn);
        this.writer.on('write', () => {
            this.lastWriteTimeMillis = Date.now();
        });
        this.reader = new ClientMessageReader();
        this.fragmentedMessageHandler = new FragmentedClientMessageHandler(this.logger);
    }
    /**
     * Returns the address of local port that is associated with this connection.
     * @returns
     */
    getLocalAddress() {
        return this.localAddress;
    }
    /**
     * Returns the address of remote node that is associated with this connection.
     * @returns
     */
    getRemoteAddress() {
        return this.remoteAddress;
    }
    setRemoteAddress(address) {
        this.remoteAddress = address;
    }
    getRemoteUuid() {
        return this.remoteUuid;
    }
    setRemoteUuid(remoteUuid) {
        this.remoteUuid = remoteUuid;
    }
    write(message) {
        const deferred = (0, Util_1.deferredPromise)();
        this.writer.write(message, deferred);
        return deferred.promise;
    }
    setConnectedServerVersion(versionString) {
        this.connectedServerVersion = BuildInfo_1.BuildInfo.calculateServerVersionFromString(versionString);
    }
    getConnectedServerVersion() {
        return this.connectedServerVersion;
    }
    /**
     * Closes this connection.
     */
    close(reason, cause) {
        if (this.closedTime !== 0) {
            return;
        }
        this.closedTime = Date.now();
        this.closedCause = cause;
        this.closedReason = reason;
        this.logClose();
        this.writer.close(this.closedCause ? this.closedCause : new Error(reason ? reason : 'Connection closed'));
        this.connectionManager.onConnectionClose(this);
    }
    isAlive() {
        return this.closedTime === 0;
    }
    getClosedReason() {
        return this.closedReason;
    }
    getStartTime() {
        return this.startTime;
    }
    getLastReadTimeMillis() {
        return this.lastReadTimeMillis;
    }
    getLastWriteTimeMillis() {
        return this.lastWriteTimeMillis;
    }
    equals(other) {
        if (other == null) {
            return false;
        }
        return this.connectionId === other.connectionId;
    }
    toString() {
        return 'Connection{'
            + 'alive=' + this.isAlive()
            + ', connectionId=' + this.connectionId
            + ', remoteAddress=' + this.remoteAddress
            + '}';
    }
    /**
     * Registers a function to pass received data on 'data' events on this connection.
     * @param callback
     */
    registerResponseCallback(callback) {
        this.socket.on('data', (buffer) => {
            this.lastReadTimeMillis = Date.now();
            this.reader.append(buffer);
            let clientMessage = this.reader.read();
            while (clientMessage !== null) {
                if (clientMessage.startFrame.hasUnfragmentedMessageFlag()) {
                    callback(clientMessage);
                }
                else {
                    this.fragmentedMessageHandler.handleFragmentedMessage(clientMessage, callback);
                }
                clientMessage = this.reader.read();
            }
            this.incrementBytesReadFn(buffer.length);
        });
    }
    setClusterUuid(uuid) {
        this.clusterUuid = uuid;
    }
    getClusterUuid() {
        return this.clusterUuid;
    }
    logClose() {
        let message = this.toString() + ' closed. Reason: ';
        if (this.closedReason != null) {
            message += this.closedReason;
        }
        else {
            message += 'Socket explicitly closed';
        }
        if (this.closedCause != null) {
            message += ' - ';
            const cause = this.closedCause;
            if (cause.code != null) {
                message += cause.code + ': ';
            }
            message += cause.message;
        }
        if (this.lifecycleService.isRunning()) {
            if (this.closedCause == null) {
                this.logger.info('Connection', message);
            }
            else {
                this.logger.warn('Connection', message);
            }
        }
        else {
            this.logger.trace('Connection', message);
        }
    }
}
exports.Connection = Connection;
//# sourceMappingURL=Connection.js.map