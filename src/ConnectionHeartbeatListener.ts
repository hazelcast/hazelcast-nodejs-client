import ClientConnection = require('./invocation/ClientConnection');
export interface ConnectionHeartbeatListener {
    onHeartbeatRestored?: (connection?: ClientConnection) => void;
    onHeartbeatStopped?: (connection?: ClientConnection) => void;
}
