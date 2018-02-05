/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
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

import {SSLOptionsFactory} from './SSLOptionsFactory';
import {Properties} from '../config/Properties';
import {HazelcastError} from '../HazelcastError';
import * as Promise from 'bluebird';
import * as fs from 'fs';
import {getBooleanOrUndefined, getStringOrUndefined, resolvePath} from '../Util';

export class BasicSSLOptionsFactory implements SSLOptionsFactory {

    private servername: string;
    private rejectUnauthorized: boolean;
    private cert: Buffer;
    private ca: Buffer;
    private ciphers: string;

    init(properties: Properties): Promise<void> {
        if (typeof properties !== 'object') {
            throw new HazelcastError('properties is not an object');
        }

        let promises = [];

        let readFile = Promise.promisify(fs.readFile);

        let certPath = getStringOrUndefined(properties['certPath']);
        let caPath = getStringOrUndefined(properties['caPath']);

        if (certPath !== undefined) {
            promises.push(readFile(resolvePath(certPath)).then((data: Buffer) => {
                this.cert = data;
            }));
        }

        if (caPath !== undefined) {
            promises.push(readFile(resolvePath(caPath)).then((data: Buffer) => {
                this.ca = data;
            }));
        }

        this.servername = getStringOrUndefined(properties['servername']);
        this.rejectUnauthorized = getBooleanOrUndefined(properties['rejectUnauthorized']);
        this.ciphers = getStringOrUndefined(properties['ciphers']);

        return Promise.all(promises).return();
    }

    getSSLOptions(): any {
        return {
            servername: this.servername,
            rejectUnauthorized: this.rejectUnauthorized,
            cert: this.cert,
            ca: this.ca
        };
    }

}
