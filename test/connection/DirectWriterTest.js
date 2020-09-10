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

const { deferredPromise } = require('../../lib/util/Util');
const { DirectWriter } = require('../../lib/network/ClientConnection');

describe('DirectWriterTest', function () {

    let queue;
    let mockSocket;

    const setUpWriteSuccess = () => {
        mockSocket = new Socket({});
        sinon.stub(mockSocket, 'write').callsFake((data, cb) => {
            cb();
            mockSocket.emit('data', data);
        });
        queue = new DirectWriter(mockSocket);
    }

    const setUpWriteFailure = (err) => {
        mockSocket = new Socket({});
        sinon.stub(mockSocket, 'write').callsFake((_, cb) => {
            cb(err);
        });
        queue = new DirectWriter(mockSocket);
    }

    it('writes single message into socket (without copying it)', (done) => {
        setUpWriteSuccess();

        const buffer = Buffer.from('test');
        mockSocket.on('data', function(data) {
            expect(data).to.be.equal(buffer);
            done();
        });

        queue.write(buffer, deferredPromise());
    });

    it('writes multiple messages separately into socket', (done) => {
        setUpWriteSuccess();

        let cnt = 0;
        mockSocket.on('data', function(data) {
            expect(data).to.be.deep.equal(Buffer.from('test'));
            if (++cnt === 3) {
                done();
            }
        });

        queue.write(Buffer.from('test'), deferredPromise());
        queue.write(Buffer.from('test'), deferredPromise());
        queue.write(Buffer.from('test'), deferredPromise());
    });

    it('resolves promise on write success', (done) => {
        setUpWriteSuccess();

        const resolver = deferredPromise();
        queue.write(Buffer.from('test'), resolver);
        resolver.promise.then(done);
    });

    it('rejects promise on write failure', (done) => {
        const err = new Error();
        setUpWriteFailure(err);

        const resolver = deferredPromise();
        queue.write(Buffer.from('test'), resolver);
        resolver.promise.catch((err) => {
            expect(err).to.be.equal(err);
            done();
        });
    });

    it('emits write event on write success', (done) => {
        setUpWriteSuccess();

        queue.on('write', done);
        queue.write(Buffer.from('test'), deferredPromise());
    });

    it('does not emit write event on write failure', (done) => {
        setUpWriteFailure(new Error());

        queue.on('write', () => done(new Error()));
        const resolver = deferredPromise();
        queue.write(Buffer.from('test'), resolver);
        resolver.promise.catch(_ => {
            done();
        });
    });

});
