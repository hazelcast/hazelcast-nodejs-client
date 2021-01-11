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

import * as fs from 'fs';
import {promisify} from 'util';
import {Properties} from '../config/Properties';
import {HazelcastError} from '../core';
import {
    getBooleanOrUndefined,
    getStringOrUndefined,
    resolvePath
} from '../util/Util';
import {SSLOptionsFactory} from './SSLOptionsFactory';

/**
 * Default implementation of {@link SSLOptionsFactory}.
 */
export class BasicSSLOptionsFactory implements SSLOptionsFactory {

    private servername: string;
    private rejectUnauthorized: boolean;
    private ca: Buffer;
    private key: Buffer;
    private cert: Buffer;
    private ciphers: string;

    init(properties: Properties): Promise<void> {
        if (typeof properties !== 'object') {
            throw new HazelcastError('properties is not an object');
        }

        const promises = [];

        const readFile = promisify(fs.readFile);

        const caPath = getStringOrUndefined(properties.caPath);
        const keyPath = getStringOrUndefined(properties.keyPath);
        const certPath = getStringOrUndefined(properties.certPath);

        if (caPath !== undefined) {
            promises.push(readFile(resolvePath(caPath)).then((data: Buffer) => {
                this.ca = data;
            }));
        }

        if (keyPath !== undefined) {
            promises.push(readFile(resolvePath(keyPath)).then((data: Buffer) => {
                this.key = data;
            }));
        }

        if (certPath !== undefined) {
            promises.push(readFile(resolvePath(certPath)).then((data: Buffer) => {
                this.cert = data;
            }));
        }

        this.servername = getStringOrUndefined(properties.servername);
        this.rejectUnauthorized = getBooleanOrUndefined(properties.rejectUnauthorized);
        this.ciphers = getStringOrUndefined(properties.ciphers);

        return Promise.all(promises)
            .then(() => undefined);
    }

    getSSLOptions(): any {
        return {
            servername: this.servername,
            rejectUnauthorized: this.rejectUnauthorized,
            ca: this.ca,
            key: this.key,
            cert: this.cert,
            ciphers: this.ciphers,
        };
    }

}
