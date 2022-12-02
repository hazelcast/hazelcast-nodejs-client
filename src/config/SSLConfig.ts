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

import {ConnectionOptions} from 'tls';
import {Properties} from './Properties';
import {SSLOptionsFactory} from '../connection/SSLOptionsFactory';

/**
 * SSL configuration.
 */
export interface SSLConfig {

    /**
     * If it is true, SSL is enabled.
     */
    enabled?: boolean;

    /**
     * Default SSL options are empty which means the following default configuration
     * is used while connecting to the server.
     *
     * ```json
     * {
     *   checkServerIdentity: (): any => null,
     *   rejectUnauthorized: true,
     * };
     * ```
     *
     * If you want to override the default behavior, you can define your own options.
     */
    sslOptions?: ConnectionOptions;

    /**
     * SSL options factory. If you don't specify it, BasicSSLOptionsFactory is used by default.
     */
    sslOptionsFactory?: SSLOptionsFactory;

    /**
     * The properties to be set for SSL options.
     */
    sslOptionsFactoryProperties?: Properties;

}

/** @internal */
export class SSLConfigImpl implements SSLConfig {

    enabled = false;
    sslOptions: ConnectionOptions = null;
    sslOptionsFactory: SSLOptionsFactory = null;
    sslOptionsFactoryProperties: Properties = null;

}
