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
/** @ignore *//** */

import {ListenerMessageCodec} from '../listener/ListenerMessageCodec';
import {ClientMessage, ClientMessageHandler} from '../protocol/ClientMessage';

/** @internal */
export class RegistrationKey {

    private readonly userRegistrationId: string;
    private registerHandlerFn: ClientMessageHandler;
    private registerRequest: ClientMessage;
    private codec: ListenerMessageCodec;

    constructor(regId: string,
                codec: ListenerMessageCodec,
                registerRequest?: ClientMessage,
                registerHandlerFn?: ClientMessageHandler) {
        this.userRegistrationId = regId;
        this.registerHandlerFn = registerHandlerFn;
        this.registerRequest = registerRequest;
        this.codec = codec;
    }

    getRegisterRequest(): ClientMessage {
        return this.registerRequest;
    }

    setRegisterRequest(registerRequest: ClientMessage): void {
        this.registerRequest = registerRequest;
    }

    getCodec(): ListenerMessageCodec {
        return this.codec;
    }

    setCodec(value: ListenerMessageCodec): void {
        this.codec = value;
    }

    getHandler(): ClientMessageHandler {
        return this.registerHandlerFn;
    }

    setHandler(handler: ClientMessageHandler): void {
        this.registerHandlerFn = handler;
    }

    getUserRegistrationKey(): string {
        return this.userRegistrationId;
    }

}
