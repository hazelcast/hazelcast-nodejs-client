"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasicSSLOptionsFactory = void 0;
const fs = require("fs");
const util_1 = require("util");
const core_1 = require("../core");
const Util_1 = require("../util/Util");
/**
 * Default implementation of {@link SSLOptionsFactory}.
 */
class BasicSSLOptionsFactory {
    init(properties) {
        if (typeof properties !== 'object') {
            throw new core_1.HazelcastError('properties is not an object');
        }
        const promises = [];
        const readFile = (0, util_1.promisify)(fs.readFile);
        const caPath = (0, Util_1.getStringOrUndefined)(properties.caPath);
        const keyPath = (0, Util_1.getStringOrUndefined)(properties.keyPath);
        const certPath = (0, Util_1.getStringOrUndefined)(properties.certPath);
        if (caPath !== undefined) {
            promises.push(readFile((0, Util_1.resolvePath)(caPath)).then((data) => {
                this.ca = data;
            }));
        }
        if (keyPath !== undefined) {
            promises.push(readFile((0, Util_1.resolvePath)(keyPath)).then((data) => {
                this.key = data;
            }));
        }
        if (certPath !== undefined) {
            promises.push(readFile((0, Util_1.resolvePath)(certPath)).then((data) => {
                this.cert = data;
            }));
        }
        this.servername = (0, Util_1.getStringOrUndefined)(properties.servername);
        this.rejectUnauthorized = (0, Util_1.getBooleanOrUndefined)(properties.rejectUnauthorized);
        this.ciphers = (0, Util_1.getStringOrUndefined)(properties.ciphers);
        return Promise.all(promises)
            .then(() => undefined);
    }
    getSSLOptions() {
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
exports.BasicSSLOptionsFactory = BasicSSLOptionsFactory;
//# sourceMappingURL=BasicSSLOptionsFactory.js.map