import ClientConnection = require('./invocation/ClientConnection');
export interface ConnectionListener {
    onConnectionOpened?: (connection: ClientConnection) => void;
    onConnectionClosed?: (connection: ClientConnection) => void;
}
