import Q = require('q');

import Address = require('../Address');
import ClientConnection = require('./ClientConnection');

import OwnerConnectionPicker = require('./OwnerConnectionPicker');
import InvocationService = require('./InvocationService');

import {GroupConfig} from '../Config';

import ConnectionAuthenticator = require('./ConnectionAuthenticator');

class ClientConnectionManager {

    private groupConfig: GroupConfig;
    private ownerConnection: ClientConnection;
    private ownerConnectionPicker: OwnerConnectionPicker;
    private invocationService: InvocationService;

    private ready = Q.defer<ClientConnectionManager>();

    constructor(addresses: Address[], groupConfig: GroupConfig, invocationService: InvocationService) {
        this.groupConfig = groupConfig;
        this.invocationService = invocationService;
        this.ownerConnectionPicker = new OwnerConnectionPicker(addresses);
    }

    public start(): Q.Promise<ClientConnectionManager> {
        this.ownerConnectionPicker.pick().then((connection) => {
            this.ownerConnection = connection;

            this.ownerConnection.registerReadCallback((data: Buffer) => {
                this.invocationService.processResponse(data);
            });

            this.authenticate();
        }).catch((e) => {
            this.ready.reject(e);
        });

        return this.ready.promise;
    }

    private authenticate() {
        var authenticator = new ConnectionAuthenticator(this.ownerConnection, this.invocationService,
            this.groupConfig.name, this.groupConfig.password);
        authenticator.authenticate().then((authenticated: boolean) => {
            if (authenticated) {
                this.ready.resolve(this);
            } else {
                this.ready.reject('Authentication failed');
            }
        });
    }
}

export = ClientConnectionManager
