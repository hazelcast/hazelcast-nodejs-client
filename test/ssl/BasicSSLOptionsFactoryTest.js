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

const { expect } = require("chai");
const path = require('path');
const { HazelcastError, BasicSSLOptionsFactory } = require('../..');

describe('BasicSSLOptionsFactoryTest', function () {

    it('factory creates sslOptions object with all supported fields', async function () {
        const options = {
            servername: 'foo.bar.com',
            rejectUnauthorized: true,
            caPath: path.join(__dirname, './server1-cert.pem'),
            keyPath: path.join(__dirname, './client1-key.pem'),
            certPath: path.join(__dirname, './client1-cert.pem'),
            ciphers: 'cipherliststring'
        };
        const factory = new BasicSSLOptionsFactory();
        await factory.init(options);
        const optsObject = factory.getSSLOptions();
        expect(optsObject.servername).to.equal('foo.bar.com');
        expect(optsObject.rejectUnauthorized).to.be.true;
        expect(optsObject.ca).to.be.instanceOf(Buffer);
        expect(optsObject.key).to.be.instanceOf(Buffer);
        expect(optsObject.cert).to.be.instanceOf(Buffer);
        expect(optsObject.ciphers).to.equal('cipherliststring');
    });

    it('BasicSSLOptionsFactory throws when provided with non-object properties', function () {
        const factory = new BasicSSLOptionsFactory();
        return expect(factory.init.bind(factory, 3)).to.throw(HazelcastError);
    });
});
