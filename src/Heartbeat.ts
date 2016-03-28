import {ClientPingCodec} from './codec/ClientPingCodec';
import HazelcastClient = require('./HazelcastClient');
import ClientConnection = require('./invocation/ClientConnection');
import {ConnectionHeartbeatListener} from './ConnectionHeartbeatListener';
import Q = require('q');
import {LoggingService} from './LoggingService';

var PROPERTY_HEARTBEAT_INTERVAL: string = 'hazelcast.client.heartbeat.interval';
var PROPERTY_HEARTBEAT_TIMEOUT: string = 'hazelcast.client.heartbeat.timeout';

class Heartbeat {

    private client: HazelcastClient;
    private heartbeatTimeout: number;
    private heartbeatInterval: number;
    private listeners: ConnectionHeartbeatListener[] = [];
    private logger = LoggingService.getLoggingService();

    //Actually it is a NodeJS.Timer. Another typing file that comes with a module we use causes TSD to see
    //return type of setTimeout as number. Because of this we defined timer property as `any` type.
    private timer: any;

    constructor(client: HazelcastClient) {
        this.client = client;
        this.heartbeatInterval = this.client.getConfig().properties[PROPERTY_HEARTBEAT_INTERVAL];
        this.heartbeatTimeout = this.client.getConfig().properties[PROPERTY_HEARTBEAT_TIMEOUT];
    }

    start() {
        this.timer = setTimeout(this.heartbeatFunction.bind(this), this.heartbeatInterval);
    }

    cancel() {
        clearTimeout(this.timer);
    }

    addListener(heartbeatListener: ConnectionHeartbeatListener) {
        this.listeners.push(heartbeatListener);
    }

    private heartbeatFunction() {
        var estConnections = this.client.getConnectionManager().establishedConnections;
        for (var address in estConnections) {
            if ( estConnections.hasOwnProperty(address)) {
                var conn = estConnections[address];
                var timeSinceLastRead = new Date().getTime() - conn.lastRead;
                if (timeSinceLastRead > this.heartbeatTimeout) {
                    if (conn.heartbeating) {
                        setImmediate(this.onHeartbeatStopped.bind(this), conn);
                    }
                }
                if (timeSinceLastRead > this.heartbeatInterval) {
                    var req = ClientPingCodec.encodeRequest();
                    this.client.getInvocationService().invokeOnConnection(conn, req);
                } else {
                    if (!conn.heartbeating) {
                        setImmediate(this.onHeartbeatRestored.bind(this), conn);
                    }
                }
            }
        }
        this.timer = setTimeout(this.heartbeatFunction.bind(this), this.heartbeatInterval);
    }

    private onHeartbeatStopped(connection: ClientConnection) {
        connection.heartbeating = false;
        this.logger.warn('HeartbeatService', 'Heartbeat stopped on ' + connection.address);
        this.listeners.forEach((listener) => {
            if (listener.hasOwnProperty('onHeartbeatStopped')) {
                setImmediate(listener.onHeartbeatStopped.bind(this), connection);
            }
        });
    }

    private onHeartbeatRestored(connection: ClientConnection) {
        connection.heartbeating = true;
        this.logger.warn('HeartbeatService', 'Heartbeat restored on ' + connection.address);
        this.listeners.forEach((listener) => {
            if (listener.hasOwnProperty('onHeartbeatRestored')) {
                setImmediate(listener.onHeartbeatRestored.bind(this), connection);
            }
        });
    }

}

export = Heartbeat;
