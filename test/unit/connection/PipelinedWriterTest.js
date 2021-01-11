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
'use strict';

const { Socket } = require('net');
const sinon = require('sinon');
const { expect } = require('chai');

const { PipelinedWriter } = require('../../../lib/network/ClientConnection');
const {
    ClientMessage,
    Frame
} = require('../../../lib/protocol/ClientMessage');
const { deferredPromise } = require('../../../lib/util/Util');

describe('PipelinedWriterTest', function () {

    const THRESHOLD = 8192;

    let writer;
    let mockSocket;

    function setUpWriteSuccess(canWrite) {
        mockSocket = new Socket({});
        sinon.stub(mockSocket, 'write').callsFake((data, cb) => {
            process.nextTick(cb);
            process.nextTick(() => mockSocket.emit('data', data));
            return canWrite;
        });
        writer = new PipelinedWriter(mockSocket, THRESHOLD);
    }

    function setUpWriteFailure(err) {
        mockSocket = new Socket({});
        sinon.stub(mockSocket, 'write').callsFake((_, cb) => {
            process.nextTick(() => cb(err));
            return false;
        });
        writer = new PipelinedWriter(mockSocket, THRESHOLD);
    }

    function createMessageFromString(content) {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.addFrame(new Frame(Buffer.from(content, 'utf8')));
        return clientMessage;
    }

    function createMessageFromBuffer(buffer) {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.addFrame(new Frame(buffer));
        return clientMessage;
    }

    it('writes single small message into socket', function(done) {
        setUpWriteSuccess(true);

        const msg = createMessageFromString('test');
        writer.write(msg, deferredPromise());
        mockSocket.on('data', (data) => {
            expect(Buffer.compare(data, msg.toBuffer())).to.be.equal(0);
            done();
        });
    });

    it('writes single large message into socket', function(done) {
        setUpWriteSuccess(true);

        const msg = createMessageFromBuffer(Buffer.allocUnsafe(THRESHOLD * 2));
        writer.write(msg, deferredPromise());
        mockSocket.on('data', (data) => {
            expect(Buffer.compare(data, msg.toBuffer())).to.be.equal(0);
            done();
        });
    });

    it('writes multiple small messages as one into socket', function(done) {
        setUpWriteSuccess(true);

        const msg1 = createMessageFromString('1');
        writer.write(msg1, deferredPromise());
        const msg2 = createMessageFromString('2');
        writer.write(msg2, deferredPromise());
        const msg3 = createMessageFromString('3');
        writer.write(msg3, deferredPromise());

        const expected = Buffer.concat([msg1.toBuffer(), msg2.toBuffer(), msg3.toBuffer()]);
        mockSocket.on('data', (data) => {
            expect(Buffer.compare(data, expected)).to.be.equal(0);
            done();
        });
    });

    it('coalesces buffers when writing into socket (1/2 of threshold)', function(done) {
        setUpWriteSuccess(true);

        // frame has header part, so we need some padding
        const size = (THRESHOLD / 2) - 50;
        const msg1 = createMessageFromBuffer(Buffer.alloc(size).fill('1'));
        const resolver1 = deferredPromise();
        writer.write(msg1, resolver1);
        const msg2 = createMessageFromBuffer(Buffer.alloc(size).fill('2'));
        const resolver2 = deferredPromise();
        writer.write(msg2, resolver2);
        const msg3 = createMessageFromBuffer(Buffer.alloc(size).fill('3'));
        const resolver3 = deferredPromise();
        writer.write(msg3, resolver3);

        let cnt = 0;
        let actualAllData = Buffer.alloc(0);
        mockSocket.on('data', (data) => {
            actualAllData = Buffer.concat([actualAllData, data]);
            cnt++;
            if (cnt === 1) {
                expect(Buffer.compare(data, Buffer.concat([msg1.toBuffer(), msg2.toBuffer()]))).to.be.equal(0);
            }
            if (cnt === 2) {
                expect(Buffer.compare(data, msg3.toBuffer())).to.be.equal(0);
            }
        });

        const expectedAllData = Buffer.concat([msg1.toBuffer(), msg2.toBuffer(), msg3.toBuffer()]);
        Promise.all([
            resolver1.promise,
            resolver2.promise,
            resolver3.promise
        ]).then(() => {
            expect(cnt).to.be.equal(2);
            expect(Buffer.compare(actualAllData, expectedAllData)).to.be.equal(0);
            done();
        });
    });

    it('allows I/O in between coalesced writes into socket', function(done) {
        setUpWriteSuccess(true);

        const size = THRESHOLD * 2;
        writer.write(createMessageFromBuffer(Buffer.alloc(size)), deferredPromise());
        writer.write(createMessageFromBuffer(Buffer.alloc(size)), deferredPromise());
        let cnt = 0;
        // the second write is queued with setImmediate,
        // thus, callback in this setImmediate must not see cnt === 0 or cnt === 2
        setImmediate(() => {
            if (cnt === 0 || cnt === 2) {
                done(new Error());
            }
        });
        mockSocket.on('data', () => {
            if (++cnt === 2) {
                done();
            }
        });
    });

    it('resolves single promise on write success', function(done) {
        setUpWriteSuccess(true);

        const resolver = deferredPromise();
        writer.write(createMessageFromString('test'), resolver);
        resolver.promise.then(done);
    });

    it('resolves multiple promises on write success', function(done) {
        setUpWriteSuccess(true);

        const resolver1 = deferredPromise();
        writer.write(createMessageFromString('test'), resolver1);
        const resolver2 = deferredPromise();
        writer.write(createMessageFromString('test'), resolver2);
        Promise.all([resolver1.promise, resolver2.promise]).then(() => done());
    });

    it('rejects single promise on write failure', function(done) {
        const err = new Error();
        setUpWriteFailure(err);

        const resolver = deferredPromise();
        writer.write(createMessageFromString('test'), resolver);
        resolver.promise.catch((err) => {
            expect(err).to.be.equal(err);
            done();
        });
    });

    it('rejects multiple promises on write failure', function(done) {
        const err = new Error();
        setUpWriteFailure(err);

        const resolver1 = deferredPromise();
        writer.write(createMessageFromString('test'), resolver1);
        const resolver2 = deferredPromise();
        writer.write(createMessageFromString('test'), resolver2);
        resolver1.promise.catch((err) => {
            expect(err).to.be.equal(err);
        });
        resolver2.promise.catch((err) => {
            expect(err).to.be.equal(err);
        });
        Promise.all([resolver1.promise, resolver2.promise]).catch(() => done());
    });

    it('emits write event on write success', function(done) {
        setUpWriteSuccess(true);

        writer.on('write', done);
        writer.write(createMessageFromString('test'), deferredPromise());
    });

    it('does not emit write event on write failure', function(done) {
        setUpWriteFailure(new Error());

        writer.on('write', () => done(new Error()));
        const resolver = deferredPromise();
        writer.write(createMessageFromString('test'), resolver);
        resolver.promise.catch(() => {
            done();
        });
    });

    it('waits for drain event when necessary', function(done) {
        setUpWriteSuccess(false);

        const msg = createMessageFromString('test');
        writer.write(msg, deferredPromise());
        let writes = 0;
        mockSocket.on('data', () => {
            if (++writes === 1) {
                writer.write(msg, deferredPromise());
                setTimeout(done, 10);
            } else {
                done(new Error('Unexpected write before drain event'));
            }
        });
    });

    it('writes queued items on drain event', function(done) {
        setUpWriteSuccess(false);

        const msg = createMessageFromString('test');
        writer.write(msg, deferredPromise());
        let writes = 0;
        mockSocket.on('data', () => {
            if (++writes === 10) {
                return done();
            }
            mockSocket.emit('drain');
            writer.write(msg, deferredPromise());
        });
    });
});
