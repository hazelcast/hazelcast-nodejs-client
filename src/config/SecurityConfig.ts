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

import {TokenCredentials, TokenCredentialsImpl, UsernamePasswordCredentials, UsernamePasswordCredentialsImpl} from '../security';

/**
 * Contains configuration for the client to use different kinds
 * of credential types during authentication, such as username/password,
 * token, or custom credentials.
 */
export interface SecurityConfig {
    /**
     * Credentials to be used with username and password authentication.
     */
    usernamePassword?: UsernamePasswordCredentials

    /**
     * Credentials to be used with token-based authentication.
     */
    token?: TokenCredentials,

    /**
     * Credentials to be used with custom authentication.
     */
    custom?: any,
}

/** @internal */
export class SecurityConfigImpl implements SecurityConfig {
    usernamePassword = new UsernamePasswordCredentialsImpl(null, null);
    token: TokenCredentialsImpl = null;
    custom: any = null;
}
