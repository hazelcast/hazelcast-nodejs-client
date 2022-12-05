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

'use strict';

const { Socket } = require('net');
const sinon = require('sinon');
const { expect } = require('chai');

const { DirectWriter } = require('../../../lib/network/Connection');
const {
    ClientMessage,
    Frame
} = require('../../../lib/protocol/ClientMessage');
const { deferredPromise } = require('../../../lib/util/Util');
const sandbox = sinon.createSandbox();

describe('DirectWriterTest', function () {
    let writer;
    let mockSocket;
    let writtenBytes;

    function createMessage(content) {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.addFrame(new Frame(Buffer.from(content, 'utf8')));
        return clientMessage;
    }

    const setUpWriteSuccess = () => {
        mockSocket = new Socket({});
        sandbox.stub(mockSocket, 'write').callsFake((data, cb) => {
            cb();
            mockSocket.emit('data', data);
        });
        writer = new DirectWriter(mockSocket, numberOfBytes => {
            writtenBytes += numberOfBytes;
        });
    };

    const setUpWriteFailure = (err) => {
        mockSocket = new Socket({});
        sandbox.stub(mockSocket, 'write').callsFake((_, cb) => {
            cb(err);
        });
        writer = new DirectWriter(mockSocket, numberOfBytes => {
            writtenBytes += numberOfBytes;
        });
    };

    afterEach(function() {
        sandbox.restore();
    });

    it('increment written bytes correctly', function(done) {
        setUpWriteSuccess();

        writtenBytes = 0;

        const msg = createMessage('test');
        mockSocket.on('data', () => {
            expect(writtenBytes).to.be.eq(msg.toBuffer().length);
            done();
        });

        writer.write(msg, deferredPromise());
    });

    it('writes single message into socket', function(done) {
        setUpWriteSuccess();

        const msg = createMessage('test');
        mockSocket.on('data', (data) => {
            expect(Buffer.compare(data, msg.toBuffer())).to.be.equal(0);
            done();
        });

        writer.write(msg, deferredPromise());
    });

    it('writes multiple messages separately into socket', function(done) {
        setUpWriteSuccess();

        const msg = createMessage('test');
        let cnt = 0;
        mockSocket.on('data', (data) => {
            expect(Buffer.compare(data, msg.toBuffer())).to.be.equal(0);
            if (++cnt === 3) {
                done();
            }
        });

        writer.write(msg, deferredPromise());
        writer.write(msg, deferredPromise());
        writer.write(msg, deferredPromise());
    });

    it('resolves promise on write success', function(done) {
        setUpWriteSuccess();

        const resolver = deferredPromise();
        writer.write(createMessage('test'), resolver);
        resolver.promise.then(done);
    });

    it('rejects promise on write failure', function(done) {
        const err = new Error();
        setUpWriteFailure(err);

        const resolver = deferredPromise();
        writer.write(createMessage('test'), resolver);
        resolver.promise.catch((err) => {
            expect(err).to.be.equal(err);
            done();
        });
    });

    it('emits write event on write success', function(done) {
        setUpWriteSuccess();

        writer.on('write', done);
        writer.write(createMessage('test'), deferredPromise());
    });

    it('does not emit write event on write failure', function(done) {
        setUpWriteFailure(new Error());

        writer.on('write', () => done(new Error()));
        const resolver = deferredPromise();
        writer.write(createMessage('test'), resolver);
        resolver.promise.catch(() => {
            done();
        });
    });

    it('should close the socket upon being closed', function() {
        setUpWriteSuccess();

        // This is equivalent to a sinon spy
        const spy = sandbox.fake(mockSocket.destroy);
        sandbox.replace(mockSocket, 'destroy', spy);
        writer.close();

        expect(spy.calledOnce).to.be.true;
    });
});
