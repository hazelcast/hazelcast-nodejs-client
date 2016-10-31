import Address = require('./Address');
import {IdentifiedDataSerializableFactory, PortableFactory} from './serialization/Serializable';
const DEFAULT_GROUP_NAME = 'dev';
const DEFAULT_GROUP_PASSWORD = 'dev-pass';

/**
 * Group configuration of the cluster that this client connects.
 * A client will connect to only the cluster with these properties.
 */
export class GroupConfig {
    /**
     * Cluster group name.
     */
    name: string = DEFAULT_GROUP_NAME;
    /**
     * Cluster group password.
     */
    password: string = DEFAULT_GROUP_PASSWORD;
}

export class SocketOptions {
    //TO-DO
}

export interface SSLOptions {
    /**
     * A string or Buffer containing the private key, certificate and CA certs of the client in PFX or PKCS12 format.
     */
    pfx?: any;   //string | Buffer

    /**
     * A string or Buffer containing the private key of the client in PEM format. (Could be an array of keys).
     */
    key?: any;   //string | Buffer

    /**
     * A string of passphrase for the private key or pfx.
     */
    passphrase?: string;

    /**
     *  A string or Buffer containing the certificate key of the client in PEM format. (Could be an array of certs).
     */
    cert?: any;  //string | Buffer

    /**
     * An array of strings or Buffers of trusted certificates in PEM format. If this is omitted several well known "root"
     * CAs will be used, like VeriSign. These are used to authorize connections.
     */
    ca?: any;    //Array of string | Buffer

    /**
     * If true, the server certificate is verified against the list of supplied CAs. An 'error' event is emitted if verification
     * fails; err.code contains the OpenSSL error code. Default: true.
     */
    rejectUnauthorized?: boolean;

    /**
     * Servername for SNI (Server Name Indication) TLS extension.
     */
    servername?: string;
}
/**
 * Network configuration
 */
export class ClientNetworkConfig {
    /**
     * Client tries to connect the members at these addresses.
     */
    addresses: Address[];

    /**
     * While client is trying to connect initially to one of the members in the {@link addresses},
     * all might be not available. Instead of giving up, throwing Exception and stopping client, it will
     * attempt to retry as much as {@link connectionAttemptLimit} times.
     */
    connectionAttemptLimit: number = 2;
    /**
     * Period for the next attempt to find a member to connect.
     */
    connectionAttemptPeriod: number = 3000;
    /**
     * Timeout value in millis for nodes to accept client connection requests.
     */
    connectionTimeout: number = 5000;
    /**
     * true if redo operations are enabled (not implemented yet)
     */
    redoOperation: boolean = false;
    /**
     * If true, client will behave as smart client instead of dummy client. Smart client sends key based operations
     * to owner of the keys. Dummy client sends all operations to a single node. See http://docs.hazelcast.org to
     * learn about smart/dummy client.
     */
    smartRouting: boolean = true;
    /**
     * Not implemented.
     */
    socketOptions: SocketOptions = new SocketOptions();

    /**
     * sslOptions is by default null which disables Ssl. A none null {@link SSLOptions} value enables Ssl.
     * @type {SSLOptions}
     */
    sslOptions: SSLOptions = null;

    constructor() {
        this.addresses = [
            new Address('localhost', 5701)
        ];
    }
}

export class SerializationConfig {
    defaultNumberType: string = 'double';
    isBigEndian: boolean = true;
    dataSerializableFactories: {[id: number]: IdentifiedDataSerializableFactory} = {};
    portableFactories: {[id: number]: PortableFactory} = {};
    portableVersion: number = 0;
    customSerializers: any[] = [];
    globalSerializer: any = null;
}

export class GlobalSerializerConfig {
    //TO-DO when implementing serialization
}

export interface LifecycleListener {
    (event: string): void;
}

/**
 * Configurations for LifecycleListeners. These are registered as soon as client started.
 */
export class ListenerConfig {
    lifecycle: Function[] = [];

    addLifecycleListener(listener: Function) {
        this.lifecycle.push(listener);
    }

    getLifecycleListeners() {
        return this.lifecycle;
    }
}

/**
 * Top level configuration object of Hazelcast client. Other configurations items are properties of this object.
 */
export class ClientConfig {
    /**
     * Name of this client instance.
     */
    instanceName: string;
    properties: any = {
        'hazelcast.client.heartbeat.interval': 5000,
        'hazelcast.client.heartbeat.timeout': 60000
    };
    groupConfig: GroupConfig = new GroupConfig();
    networkConfig: ClientNetworkConfig = new ClientNetworkConfig();
    customCredentials: any = null;
    listeners: ListenerConfig = new ListenerConfig();
    serializationConfig: SerializationConfig = new SerializationConfig();
}
