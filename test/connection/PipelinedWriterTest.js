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

'use strict';

const Buffer = require('safe-buffer').Buffer;
const Socket = require('net').Socket;
const sinon = require('sinon');
const expect = require('chai').expect;
const Promise = require('bluebird');

const DeferredPromise = require('../../lib/Util').DeferredPromise;
const PipelinedWriter = require('../../lib/invocation/ClientConnection').PipelinedWriter;

describe('PipelinedWriter', function () {

    let writer;
    let mockSocket;

    const setUpWriteSuccess = () => {
        mockSocket = new Socket({});
        sinon.stub(mockSocket, 'write').callsFake((data, cb) => {
            cb();
            mockSocket.emit('data', data);
        });
        writer = new PipelinedWriter(mockSocket, 8192);
    }

    const setUpWriteFailure = (err) => {
        mockSocket = new Socket({});
        sinon.stub(mockSocket, 'write').callsFake((_, cb) => {
            cb(err);
        });
        writer = new PipelinedWriter(mockSocket, 8192);
    }

    it('writes single message into socket (without copying it)', (done) => {
        setUpWriteSuccess();
        
        const buffer = Buffer.from('test');
        writer.write(buffer, DeferredPromise());
        mockSocket.on('data', function(data) {
            expect(data).to.be.equal(buffer);
            done();
        });
    });

    it('writes multiple messages as one into socket', (done) => {
        setUpWriteSuccess();

        writer.write(Buffer.from('1'), DeferredPromise());
        writer.write(Buffer.from('2'), DeferredPromise());
        writer.write(Buffer.from('3'), DeferredPromise());
        mockSocket.on('data', function(data) {
            expect(data).to.be.deep.equal(Buffer.from('123'));
            done();
        });
    });

    it('coalesces buffers when writing into socket', (done) => {
        setUpWriteSuccess();

        const size = 4200;
        const resolver1 = DeferredPromise();
        writer.write(Buffer.alloc(size), resolver1);
        const resolver2 = DeferredPromise();
        writer.write(Buffer.alloc(size), resolver2);
        const resolver3 = DeferredPromise();
        writer.write(Buffer.alloc(size), resolver3);
        
        let cnt = 0;
        let allData = Buffer.alloc(0);
        mockSocket.on('data', function(data) {
            allData = Buffer.concat([allData, data]);
            cnt += 1;
            if (cnt === 1) {
                expect(data).to.be.deep.equal(Buffer.alloc(size * 2));
            }
            if (cnt === 2) {
                expect(data).to.be.deep.equal(Buffer.alloc(size));
            }
        });
        
        Promise.all([
            resolver1.promise,
            resolver2.promise,
            resolver3.promise
        ]).then(() => {
            expect(cnt).to.be.equal(2);
            expect(allData).to.be.deep.equal(Buffer.alloc(size * 3));
            done();
        });
    });

    it('allows I/O in between coalesced writes into socket', (done) => {
        setUpWriteSuccess();

        const size = 9000;
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
        mockSocket.on('data', function(data) {
            if (++cnt === 2) {
                done();
            }
        });
    });

    it('resolves single promise on write success', (done) => {
        setUpWriteSuccess();

        const resolver = DeferredPromise();
        writer.write(Buffer.from('test'), resolver);
        resolver.promise.then(done);
    });

    it('resolves multiple promises on write success', (done) => {
        setUpWriteSuccess();

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
        setUpWriteSuccess();

        writer.on('write', done);
        writer.write(Buffer.from('test'), DeferredPromise());
    });

    it('does not emit write event on write failure', (done) => {
        setUpWriteFailure(new Error());

        writer.on('write', () => done(new Error()));
        const resolver = DeferredPromise();
        writer.write(Buffer.from('test'), resolver);
        resolver.promise.catch(_ => {
            done();
        });
    });

});
