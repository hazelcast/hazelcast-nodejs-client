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

import * as Long from 'long';
import {ListenerMessageCodec} from '../ListenerMessageCodec';
import {ClientConnection} from './ClientConnection';

export class ClientEventRegistration {
    readonly serverRegistrationId: string;
    readonly correlationId: Long;
    readonly subscriber: ClientConnection;
    readonly codec: ListenerMessageCodec;

    constructor(serverRegistrationId: string, correlationId: Long, subscriber: ClientConnection, codec: ListenerMessageCodec) {
        this.serverRegistrationId = serverRegistrationId;
        this.correlationId = correlationId;
        this.subscriber = subscriber;
        this.codec = codec;
    }

    toString(): string {
        return this.serverRegistrationId;
    }
}
