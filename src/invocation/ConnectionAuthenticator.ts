import Q = require('q');

import ClientConnection = require('./ClientConnection');
import {InvocationService} from './InvocationService';
import ClientMessage = require('../ClientMessage');
import {ClientAuthenticationCodec} from '../codec/ClientAuthenticationCodec';

class ConnectionAuthenticator {

    private connection: ClientConnection;
    private group: string;
    private password: string;
    private invocationService: InvocationService;

    constructor(connection: ClientConnection, invocationService: InvocationService, group: string, password: string) {
        this.connection = connection;
        this.invocationService = invocationService;
        this.group = group;
        this.password = password;
    }

    authenticate(): Q.Promise<boolean> {
        var clientMessage = ClientAuthenticationCodec
            .encodeRequest(this.group, this.password, null, null, true, 'NodeJS', 1);

        var deferred = Q.defer<boolean>();

        this.invocationService
            .invokeOnConnection(this.connection, clientMessage)
            .then((msg: ClientMessage) => {
                var authResponse = ClientAuthenticationCodec.decodeResponse(msg);
                if (authResponse.status === 0) {
                    this.connection.address = authResponse.address;
                    deferred.resolve(true);
                } else {
                    deferred.resolve(false);
                }
            });

        return deferred.promise;
    }
}

export = ConnectionAuthenticator
