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

import {UsernamePasswordCredentials} from './UsernamePasswordCredentials';
import {TokenCredentials} from './TokenCredentials';
import {CredentialsType} from './CredentialsType';
import {Credentials} from './Credentials';
import {TokenEncoding} from './TokenEncoding';

/** @internal */
export class CredentialsTypeGuards {
    public static isUsernamePasswordCredentials(credentials: any): credentials is UsernamePasswordCredentials {
        return typeof credentials.type === 'string'
            && credentials.type.toUpperCase() === CredentialsType.USERNAME_PASSWORD
            && (credentials.username === null || typeof credentials.username === 'string')
            && (credentials.password === null || typeof credentials.password === 'string')
            && Object.keys(credentials).length === 3;
    }

    public static isTokenCredentials(credentials: any): credentials is TokenCredentials {
        return typeof credentials.type === 'string'
            && credentials.type.toUpperCase() === CredentialsType.TOKEN
            && typeof credentials.token === 'string'
            && (credentials.hasOwnProperty('encoding')
                    ? (typeof credentials.encoding === 'string'
                        && credentials.encoding.toUpperCase() in TokenEncoding
                        && Object.keys(credentials).length === 3)
                    : Object.keys(credentials).length === 2);
    }

    public static isCustomCredentials(credentials: any): credentials is Credentials {
        return typeof credentials.type === 'string'
            && credentials.type.toUpperCase() === CredentialsType.CUSTOM;
    }
}
