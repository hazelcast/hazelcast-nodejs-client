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

import {ConnectionOptions} from 'tls';
import {Properties} from './Properties';
import {ImportConfig} from './ImportConfig';

/**
 * SSL configuration.
 */
export class SSLConfig {

    /**
     * If it is true, SSL is enabled.
     */
    enabled = false;

    /**
     * sslOptions is by default null which means the following default configuration
     * is used while connecting to the server.
     *
     * {
     *   checkServerIdentity: (): any => null,
     *   rejectUnauthorized: true,
     * };
     *
     * If you want to override the default behavior, you can write your own connection sslOptions.
     */
    sslOptions: ConnectionOptions = null;

    /**
     * sslOptionsFactoryConfig is config for ssl options factory. If you don't specify the path, BasicSSLOptionsFactory is used
     * by default.
     */
    sslOptionsFactoryConfig: ImportConfig = null;

    /**
     * sslOptionsFactoryProperties is the properties to be set for ssl options.
     */
    sslOptionsFactoryProperties: Properties = null;
}
