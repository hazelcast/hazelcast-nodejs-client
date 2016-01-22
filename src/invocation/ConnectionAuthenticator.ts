import Q = require("q");

import ClientConnection = require("./ClientConnection");
import InvocationService = require("./InvocationService");
import AuthRequest = require("../messages/auth/AuthRequest");
import AuthEncoder = require("../codec/AuthEncoder");
import AuthDecoder = require("../codec/AuthDecoder");
import ClientMessage = require("../ClientMessage");

class ConnectionAuthenticator {

    private connection:ClientConnection;
    private group:string;
    private password:string;
    private invocationService:InvocationService;

    constructor(connection:ClientConnection, invocationService:InvocationService, group:string, password:string) {
        this.connection = connection;
        this.invocationService = invocationService;
        this.group = group;
        this.password = password;
    }

    authenticate():Q.Promise<boolean> {
        var authRequest = new AuthRequest(this.group, this.password, true, null, null, "NodeJS", 1);
        var clientMessage = AuthEncoder.encodeRequest(authRequest);

        var deferred = Q.defer<boolean>();

        this.invocationService
            .invokeOnConnection(this.connection, clientMessage)
            .then((msg:ClientMessage) => {
                var authResponse = AuthDecoder.decode(msg);
                if (authResponse.status == 0) {
                    deferred.resolve(true);
                } else {
                    deferred.reject(false);
                }
            });

        return deferred.promise;
    }
}

export = ConnectionAuthenticator
