import ClientConnection = require('./invocation/ClientConnection');
/**
 * Listener interface for heartbeat service.
 */
export interface ConnectionHeartbeatListener {
    /**
     * Invoked when heartbeat of a server is restored after stopped.
     * @param connection connection object associated with that server node.
     */
    onHeartbeatRestored?: (connection?: ClientConnection) => void;
    /**
     * Invoked when heartbeat of a server node failed.
     * @param connection connection object associated with that server node.
     */
    onHeartbeatStopped?: (connection?: ClientConnection) => void;
}
