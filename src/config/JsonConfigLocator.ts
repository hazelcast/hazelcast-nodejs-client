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

import * as Promise from 'bluebird';
import * as fs from 'fs';
import * as Path from 'path';
import {LogLevel} from '../logging/LoggingService';
import {DeferredPromise} from '../Util';
import {DefaultLogger} from '../logging/DefaultLogger';

export class JsonConfigLocator {
    static readonly ENV_VARIABLE_NAME = 'HAZELCAST_CLIENT_CONFIG';
    static readonly DEFAULT_FILE_NAME = 'hazelcast-client.json';

    private buffer: Buffer;
    private configLocation: string;
    private logger = new DefaultLogger(LogLevel.INFO);

    load(): Promise<void> {
        return this.loadFromEnvironment().then((loaded: boolean) => {
            if (loaded) {
                return;
            }
            return this.loadFromWorkingDirectory().then((loaded: boolean) => {
                if (loaded) {
                    return;
                }
            });
        });
    }

    loadFromEnvironment(): Promise<boolean> {
        const envVariableLocation = process.env[JsonConfigLocator.ENV_VARIABLE_NAME];
        if (envVariableLocation) {
            const loadLocation = Path.resolve(envVariableLocation);
            this.logger.trace('ConfigBuilder', 'Loading config from ' + loadLocation);
            return this.loadPath(loadLocation).then((buffer: Buffer) => {
                this.configLocation = loadLocation;
                this.buffer = buffer;
                return true;
            });
        } else {
            return Promise.resolve(false);
        }
    }

    loadFromWorkingDirectory(): Promise<boolean> {
        const cwd = process.cwd();
        const jsonPath = Path.resolve(cwd, JsonConfigLocator.DEFAULT_FILE_NAME);
        const deferred = DeferredPromise<boolean>();
        fs.access(jsonPath, (err) => {
            if (err) {
                deferred.resolve(false);
            } else {
                this.loadPath(jsonPath).then((buffer: Buffer) => {
                    this.buffer = buffer;
                    this.configLocation = jsonPath;
                    deferred.resolve(true);
                }).catch((e) => {
                    deferred.reject(e);
                });
            }
        });
        return deferred.promise;
    }

    loadImported(path: string): Promise<Buffer> {
        return this.loadPath(Path.resolve(Path.dirname(this.configLocation), path));
    }

    loadPath(path: string): Promise<Buffer> {
        const deferred = DeferredPromise<Buffer>();
        fs.readFile(path, (err, data: Buffer) => {
            if (err) {
                this.logger.trace('JsonConfigLocator', 'Cannot read from ' + path.toString());
                deferred.reject(err);
            } else {
                deferred.resolve(data);
            }
        });
        return deferred.promise;
    }

    getBuffer(): Buffer {
        return this.buffer;
    }
}
