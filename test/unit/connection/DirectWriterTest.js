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

const { DirectWriter } = require('../../../lib/network/Connection');
const {
    ClientMessage,
    Frame
} = require('../../../lib/protocol/ClientMessage');
const { deferredPromise } = require('../../../lib/util/Util');

describe('DirectWriterTest', function () {

    let queue;
    let mockSocket;

    function createMessage(content) {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.addFrame(new Frame(Buffer.from(content, 'utf8')));
        return clientMessage;
    }

    const setUpWriteSuccess = () => {
        mockSocket = new Socket({});
        sinon.stub(mockSocket, 'write').callsFake((data, cb) => {
            cb();
            mockSocket.emit('data', data);
        });
        queue = new DirectWriter(mockSocket);
    };

    const setUpWriteFailure = (err) => {
        mockSocket = new Socket({});
        sinon.stub(mockSocket, 'write').callsFake((_, cb) => {
            cb(err);
        });
        queue = new DirectWriter(mockSocket);
    };

    it('writes single message into socket', function(done) {
        setUpWriteSuccess();

        const msg = createMessage('test');
        mockSocket.on('data', (data) => {
            expect(Buffer.compare(data, msg.toBuffer())).to.be.equal(0);
            done();
        });

        queue.write(msg, deferredPromise());
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

        queue.write(msg, deferredPromise());
        queue.write(msg, deferredPromise());
        queue.write(msg, deferredPromise());
    });

    it('resolves promise on write success', function(done) {
        setUpWriteSuccess();

        const resolver = deferredPromise();
        queue.write(createMessage('test'), resolver);
        resolver.promise.then(done);
    });

    it('rejects promise on write failure', function(done) {
        const err = new Error();
        setUpWriteFailure(err);

        const resolver = deferredPromise();
        queue.write(createMessage('test'), resolver);
        resolver.promise.catch((err) => {
            expect(err).to.be.equal(err);
            done();
        });
    });

    it('emits write event on write success', function(done) {
        setUpWriteSuccess();

        queue.on('write', done);
        queue.write(createMessage('test'), deferredPromise());
    });

    it('does not emit write event on write failure', function(done) {
        setUpWriteFailure(new Error());

        queue.on('write', () => done(new Error()));
        const resolver = deferredPromise();
        queue.write(createMessage('test'), resolver);
        resolver.promise.catch(() => {
            done();
        });
    });

});
