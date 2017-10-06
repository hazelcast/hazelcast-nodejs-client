import * as Long from 'long';
import ClientConnection = require('./ClientConnection');

export class ClientEventRegistration {
    readonly serverRegistrationId: string;
    readonly correlationId: Long;
    readonly subscriber: ClientConnection;

    constructor(serverRegistrationId: string, correlationId: Long, subscriber: ClientConnection) {
        this.serverRegistrationId = serverRegistrationId;
        this.correlationId = correlationId;
        this.subscriber = subscriber;
    }

    toString(): string {
        return this.serverRegistrationId;
    }
}
