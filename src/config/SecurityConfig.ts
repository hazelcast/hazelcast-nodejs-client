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

import {Credentials} from '../security/Credentials';
import {UsernamePasswordCredentialsImpl} from '../security';

/**
 * Contains configuration for the client to use different kinds
 * of credential types during authentication, such as username
 * password, token, or custom credentials.
 */
export interface SecurityConfig {
    /**
     * Represents an identity to be authenticated.
     */
    credentials?: Credentials
}

/** @internal */
export class SecurityConfigImpl implements SecurityConfig {
    credentials: Credentials = new UsernamePasswordCredentialsImpl(null, null);
}
