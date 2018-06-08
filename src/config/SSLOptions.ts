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

export interface SSLOptions {
    /**
     * A string or Buffer containing the private key, certificate and CA certs of the client in PFX or PKCS12 format.
     */
    pfx?: any;   // string | Buffer

    /**
     * A string or Buffer containing the private key of the client in PEM format. (Could be an array of keys).
     */
    key?: any;   // string | Buffer

    /**
     * A string of passphrase for the private key or pfx.
     */
    passphrase?: string;

    /**
     *  A string or Buffer containing the certificate key of the client in PEM format. (Could be an array of certs).
     */
    cert?: any;  // string | Buffer

    /**
     * An array of strings or Buffers of trusted certificates in PEM format. If this is omitted several well known "root"
     * CAs will be used, like VeriSign. These are used to authorize connections.
     */
    ca?: any;    // Array of string | Buffer

    /**
     * If true, the server certificate is verified against the list of supplied CAs. An 'error' event is emitted if verification
     * fails; err.code contains the OpenSSL error code. Default: true.
     */
    rejectUnauthorized?: boolean;

    /**
     * Servername for SNI (Server Name Indication) TLS extension.
     */
    servername?: string;
}
