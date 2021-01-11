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

import * as Promise from 'bluebird';
import {ClientAuthenticationCodec} from '../codec/ClientAuthenticationCodec';
import HazelcastClient from '../HazelcastClient';
import {ClientAuthenticationCustomCodec} from '../codec/ClientAuthenticationCustomCodec';
import {ClientConnection} from './ClientConnection';
import {ClusterService} from './ClusterService';
import {AuthenticationError} from '../HazelcastError';
import {ILogger} from '../logging/ILogger';
import ClientMessage = require('../ClientMessage');
import {BuildInfo} from '../BuildInfo';

const enum AuthenticationStatus {
    AUTHENTICATED = 0,
    CREDENTIALS_FAILED = 1,
    SERIALIZATION_VERSION_MISMATCH = 2,
}

export class ConnectionAuthenticator {

    private connection: ClientConnection;
    private client: HazelcastClient;
    private clusterService: ClusterService;
    private logger: ILogger;

    constructor(connection: ClientConnection, client: HazelcastClient) {
        this.connection = connection;
        this.client = client;
        this.logger = this.client.getLoggingService().getLogger();
        this.clusterService = this.client.getClusterService();
    }

    authenticate(asOwner: boolean): Promise<void> {
        const credentials: ClientMessage = this.createCredentials(asOwner);
        return this.client.getInvocationService()
            .invokeOnConnection(this.connection, credentials)
            .then((msg: ClientMessage) => {
                const authResponse = ClientAuthenticationCodec.decodeResponse(msg);
                switch (authResponse.status) {
                    case AuthenticationStatus.AUTHENTICATED:
                        this.connection.setAddress(authResponse.address);
                        this.connection.setConnectedServerVersion(authResponse.serverHazelcastVersion);
                        if (asOwner) {
                            this.clusterService.uuid = authResponse.uuid;
                            this.clusterService.ownerUuid = authResponse.ownerUuid;

                        }
                        this.logger.info('ConnectionAuthenticator',
                            'Connection to ' +
                            this.connection.getAddress().toString() + ' authenticated');
                        break;
                    case AuthenticationStatus.CREDENTIALS_FAILED:
                        this.logger.error('ConnectionAuthenticator', 'Invalid Credentials');
                        throw new Error('Invalid Credentials, could not authenticate connection to ' +
                            this.connection.getAddress().toString());
                    case AuthenticationStatus.SERIALIZATION_VERSION_MISMATCH:
                        this.logger.error('ConnectionAuthenticator', 'Serialization version mismatch');
                        throw new Error('Serialization version mismatch, could not authenticate connection to ' +
                            this.connection.getAddress().toString());
                    default:
                        this.logger.error('ConnectionAuthenticator', 'Unknown authentication status: '
                            + authResponse.status);
                        throw new AuthenticationError('Unknown authentication status: ' + authResponse.status +
                            ' , could not authenticate connection to ' +
                            this.connection.getAddress().toString());
                }
            });
    }

    createCredentials(asOwner: boolean): ClientMessage {
        const groupConfig = this.client.getConfig().groupConfig;
        const uuid: string = this.clusterService.uuid;
        const ownerUuid: string = this.clusterService.ownerUuid;

        const customCredentials = this.client.getConfig().customCredentials;

        let clientMessage: ClientMessage;

        const clientVersion = BuildInfo.getClientVersion();

        if (customCredentials != null) {
            const credentialsPayload = this.client.getSerializationService().toData(customCredentials);

            clientMessage = ClientAuthenticationCustomCodec.encodeRequest(
                credentialsPayload, uuid, ownerUuid, asOwner, 'NJS', 1, clientVersion);
        } else {
            clientMessage = ClientAuthenticationCodec.encodeRequest(
                groupConfig.name, groupConfig.password, uuid, ownerUuid, asOwner, 'NJS', 1, clientVersion);

        }

        return clientMessage;
    }
}
