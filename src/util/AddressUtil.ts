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
/** @ignore *//** */

import * as dns from 'dns';
import * as net from 'net';
import {AddressImpl, Addresses} from '../core';

/** @internal */
const MAX_PORT_TRIES = 3;
/** @internal */
const INITIAL_FIRST_PORT = 5701;

/** @internal */
export function getSocketAddresses(address: string): Addresses {
    const addressHolder = createAddressFromString(address);
    let possiblePort = addressHolder.port;
    let maxPortTryCount = 1;
    if (possiblePort === -1) {
        maxPortTryCount = MAX_PORT_TRIES;
        possiblePort = INITIAL_FIRST_PORT;
    }

    const addressList: AddressImpl[] = [];
    for (let i = 0; i < maxPortTryCount; i++) {
        addressList.push(new AddressImpl(addressHolder.host, possiblePort + i));
    }

    let addresses;
    if (addressList.length > 0) {
        const primary = [ addressList[0] ];
        const secondary = addressList.slice(1);
        addresses = new Addresses(primary, secondary);
    } else {
        addresses = new Addresses();
    }
    return addresses;
}

/** @internal */
export function createAddressFromString(address: string, defaultPort = -1): AddressImpl {
    const indexBracketStart = address.indexOf('[');
    const indexBracketEnd = address.indexOf(']', indexBracketStart);
    const indexColon = address.indexOf(':');
    const lastIndexColon = address.lastIndexOf(':');
    let host: string;
    let port = defaultPort;
    if (indexColon > -1 && lastIndexColon > indexColon) {
        // IPv6
        if (indexBracketStart === 0 && indexBracketEnd > indexBracketStart) {
            host = address.substring(indexBracketStart + 1, indexBracketEnd);
            if (lastIndexColon === indexBracketEnd + 1) {
                port = Number.parseInt(address.substring(lastIndexColon + 1));
            }
        } else {
            host = address;
        }
    } else if (indexColon > 0 && indexColon === lastIndexColon) {
        host = address.substring(0, indexColon);
        port = Number.parseInt(address.substring(indexColon + 1));
    } else {
        host = address;
    }
    return new AddressImpl(host, port);
}

/**
 * Resolves the given address to IP address.
 * @param address address in one of 'host'/'host:port'/'ip'/'ip:host' formats
 * @returns IP (IPv4 or IPv6) address string
 * @internal
 */
export function resolveAddress(address: string): Promise<string> {
    return Promise.resolve()
        .then(() => {
            if (address == null || address.length === 0) {
                throw new Error('Address must be non-null and non-empty');
            }
            return createAddressFromString(address);
        })
        .then(({ host }) => {
            if (host == null || host.length === 0) {
                throw new Error('Parsed host must be non-null and non-empty');
            }
            return new Promise((resolve, reject) => {
                dns.lookup(host, (err, ipAddress) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(ipAddress);
                });
            });
        });
}

/**
 * Checks if the target address (host:port) is reachable via trying to
 * open a plain TCP connection.
 * @param host      target host.
 * @param port      target port.
 * @param timeoutMs connection timeout in milliseconds.
 * @returns check result
 * @internal
 */
export function isAddressReachable(host: string,
                                   port: number,
                                   timeoutMs: number): Promise<boolean> {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(timeoutMs);
        const onError = () => {
            socket.destroy();
            resolve(false);
        };
        socket.once('error', onError);
        socket.once('timeout', onError);
        socket.connect(port, host, () => {
            socket.end();
            resolve(true);
        });
    });
}
