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

'use strict';

const Socket = require('net').Socket;
const sinon = require('sinon');
const expect = require('chai').expect;
const Promise = require('bluebird');

const { DeferredPromise } = require('../../lib/util/Util');
const { PipelinedWriter } = require('../../lib/network/ClientConnection');

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

    it('writes single small message into socket (without copying it)', (done) => {
        setUpWriteSuccess(true);

        const buffer = Buffer.from('test');
        writer.write(buffer, DeferredPromise());
        mockSocket.on('data', (data) => {
            expect(data).to.be.equal(buffer);
            done();
        });
    });

    it('writes single large message into socket (without copying it)', (done) => {
        setUpWriteSuccess(true);

        const buffer = Buffer.allocUnsafe(THRESHOLD * 2);
        writer.write(buffer, DeferredPromise());
        mockSocket.on('data', (data) => {
            expect(data).to.be.equal(buffer);
            done();
        });
    });

    it('writes multiple small messages as one into socket', (done) => {
        setUpWriteSuccess(true);

        writer.write(Buffer.from('1'), DeferredPromise());
        writer.write(Buffer.from('2'), DeferredPromise());
        writer.write(Buffer.from('3'), DeferredPromise());
        mockSocket.on('data', (data) => {
            expect(Buffer.compare(data, Buffer.from('123'))).to.be.equal(0);
            done();
        });
    });

    it('coalesces buffers when writing into socket (1/2 of threshold)', (done) => {
        setUpWriteSuccess(true);

        const size = THRESHOLD / 2;
        const data1 = Buffer.alloc(size).fill('1');
        const resolver1 = DeferredPromise();
        writer.write(data1, resolver1);
        const data2 = Buffer.alloc(size).fill('2');
        const resolver2 = DeferredPromise();
        writer.write(data2, resolver2);
        const data3 = Buffer.alloc(size).fill('3');
        const resolver3 = DeferredPromise();
        writer.write(data3, resolver3);

        let cnt = 0;
        let allData = Buffer.alloc(0);
        mockSocket.on('data', (data) => {
            allData = Buffer.concat([allData, data]);
            cnt++;
            if (cnt === 1) {
                expect(Buffer.compare(data, Buffer.concat([data1, data2]))).to.be.equal(0);
            }
            if (cnt === 2) {
                expect(Buffer.compare(data, data3)).to.be.equal(0);
            }
        });

        Promise.all([
            resolver1.promise,
            resolver2.promise,
            resolver3.promise
        ]).then(() => {
            expect(cnt).to.be.equal(2);
            expect(Buffer.compare(allData, Buffer.concat([data1, data2, data3]))).to.be.equal(0);
            done();
        });
    });

    it('allows I/O in between coalesced writes into socket', (done) => {
        setUpWriteSuccess(true);

        const size = THRESHOLD * 2;
        writer.write(Buffer.alloc(size), DeferredPromise());
        writer.write(Buffer.alloc(size), DeferredPromise());
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

    it('resolves single promise on write success', (done) => {
        setUpWriteSuccess(true);

        const resolver = DeferredPromise();
        writer.write(Buffer.from('test'), resolver);
        resolver.promise.then(done);
    });

    it('resolves multiple promises on write success', (done) => {
        setUpWriteSuccess(true);

        const resolver1 = DeferredPromise();
        writer.write(Buffer.from('test'), resolver1);
        const resolver2 = DeferredPromise();
        writer.write(Buffer.from('test'), resolver2);
        Promise.all([resolver1.promise, resolver2.promise]).then(() => done());
    });

    it('rejects single promise on write failure', (done) => {
        const err = new Error();
        setUpWriteFailure(err);

        const resolver = DeferredPromise();
        writer.write(Buffer.from('test'), resolver);
        resolver.promise.catch((err) => {
            expect(err).to.be.equal(err);
            done();
        });
    });

    it('rejects multiple promises on write failure', (done) => {
        const err = new Error();
        setUpWriteFailure(err);

        const resolver1 = DeferredPromise();
        writer.write(Buffer.from('test'), resolver1);
        const resolver2 = DeferredPromise();
        writer.write(Buffer.from('test'), resolver2);
        resolver1.promise.catch((err) => {
            expect(err).to.be.equal(err);
        });
        resolver2.promise.catch((err) => {
            expect(err).to.be.equal(err);
        });
        Promise.all([resolver1.promise, resolver2.promise]).catch(() => done());
    });

    it('emits write event on write success', (done) => {
        setUpWriteSuccess(true);

        writer.on('write', done);
        writer.write(Buffer.from('test'), DeferredPromise());
    });

    it('does not emit write event on write failure', (done) => {
        setUpWriteFailure(new Error());

        writer.on('write', () => done(new Error()));
        const resolver = DeferredPromise();
        writer.write(Buffer.from('test'), resolver);
        resolver.promise.catch(() => {
            done();
        });
    });

    it('waits for drain event when necessary', (done) => {
        setUpWriteSuccess(false);

        const buffer = Buffer.from('test');
        writer.write(buffer, DeferredPromise());
        let writes = 0;
        mockSocket.on('data', () => {
            if (++writes === 1) {
                writer.write(buffer, DeferredPromise());
                setTimeout(done, 10);
            } else {
                done(new Error('Unexpected write before drain event'));
            }
        });
    });

    it('writes queued items on drain event', (done) => {
        setUpWriteSuccess(false);

        const buffer = Buffer.from('test');
        writer.write(buffer, DeferredPromise());
        let writes = 0;
        mockSocket.on('data', () => {
            if (++writes === 10) {
                return done();
            }
            mockSocket.emit('drain');
            writer.write(buffer, DeferredPromise());
        });
    });
});
