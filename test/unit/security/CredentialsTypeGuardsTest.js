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

const {CredentialsTypeGuards} = require('../../../lib/security/CredentialsTypeGuards');
const {expect} = require('chai');

describe('CredentialsTypeGuardsTest', function () {
    describe('username password credentials', function () {
        it('should return true for a valid username and password', function () {
            const credentials = {
                type: 'USERNAME_PASSWORD',
                username: 'username',
                password: 'password',
            };

            expect(CredentialsTypeGuards.isUsernamePasswordCredentials(credentials)).to.be.true;
        });

        it('should return true for a valid username and password with lowercase type', function () {
            const credentials = {
                type: 'username_password',
                username: 'username',
                password: 'password',
            };

            expect(CredentialsTypeGuards.isUsernamePasswordCredentials(credentials)).to.be.true;
        });

        it('should return false for an extra property', function () {
            const credentials = {
                type: 'USERNAME_PASSWORD',
                username: 'username',
                password: 'password',
                extra: 'extra',
            };

            expect(CredentialsTypeGuards.isUsernamePasswordCredentials(credentials)).to.be.false;
        });

        it('should return false for type mismatch of username', function () {
            const credentials = {
                type: 'USERNAME_PASSWORD',
                username: 0,
                password: 'password',
            };

            expect(CredentialsTypeGuards.isUsernamePasswordCredentials(credentials)).to.be.false;
        });

        it('should return false for type mismatch of password', function () {
            const credentials = {
                type: 'USERNAME_PASSWORD',
                username: 'username',
                password: 0,
            };

            expect(CredentialsTypeGuards.isUsernamePasswordCredentials(credentials)).to.be.false;
        });

        it('should return false for a missing property', function () {
            const credentials = {
                username: 'username',
                password: 'password',
            };

            expect(CredentialsTypeGuards.isUsernamePasswordCredentials(credentials)).to.be.false;
        });
    });

    describe('token credentials', function () {
        it('should return true for a valid token', function () {
            const credentials = {
                type: 'TOKEN',
                token: 'token',
            };

            expect(CredentialsTypeGuards.isTokenCredentials(credentials)).to.be.true;
        });

        it('should return true for a valid token with encoding', function () {
            const credentials = {
                type: 'TOKEN',
                token: 'token',
                encoding: 'ASCII'
            };

            expect(CredentialsTypeGuards.isTokenCredentials(credentials)).to.be.true;
        });

        it('should return true for a valid token with lowercase encoding', function () {
            const credentials = {
                type: 'TOKEN',
                token: 'token',
                encoding: 'ascii'
            };

            expect(CredentialsTypeGuards.isTokenCredentials(credentials)).to.be.true;
        });

        it('should return true for a valid token with lowercase type', function () {
            const credentials = {
                type: 'token',
                token: 'token',
            };

            expect(CredentialsTypeGuards.isTokenCredentials(credentials)).to.be.true;
        });

        it('should return false for an extra property', function () {
            const credentials = {
                type: 'TOKEN',
                token: 'token',
                extra: 'extra',
            };

            expect(CredentialsTypeGuards.isTokenCredentials(credentials)).to.be.false;
        });

        it('should return false for type mismatch of token', function () {
            const credentials = {
                type: 'TOKEN',
                token: 0,
            };

            expect(CredentialsTypeGuards.isTokenCredentials(credentials)).to.be.false;
        });

        it('should return false for type mismatch of encoding', function () {
            const credentials = {
                type: 'TOKEN',
                token: 'token',
                encoding: 0,
            };

            expect(CredentialsTypeGuards.isTokenCredentials(credentials)).to.be.false;
        });

        it('should return false for an invalid encoding', function () {
            const credentials = {
                type: 'TOKEN',
                token: 'token',
                encoding: 'encoding',
            };

            expect(CredentialsTypeGuards.isTokenCredentials(credentials)).to.be.false;
        });

        it('should return false for a missing property', function () {
            const credentials = {
                token: 'token',
            };

            expect(CredentialsTypeGuards.isTokenCredentials(credentials)).to.be.false;
        });
    });

    describe('custom credentials', function () {
        it('should return true for custom credentials', function () {
            const credentials = {
                type: 'CUSTOM',
                something: 'something',
            };

            expect(CredentialsTypeGuards.isCustomCredentials(credentials)).to.be.true;
        });

        it('should return true for custom credentials with lowercase type', function () {
            const credentials = {
                type: 'custom',
                something: 'something',
            };

            expect(CredentialsTypeGuards.isCustomCredentials(credentials)).to.be.true;
        });

        it('should return false for a missing property', function () {
            const credentials = {
                something: 'something',
            };

            expect(CredentialsTypeGuards.isCustomCredentials(credentials)).to.be.false;
        });
    });
});
