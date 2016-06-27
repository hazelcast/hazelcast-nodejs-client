import ClientConnection = require('./ClientConnection');
import Address = require('../Address');
import * as Promise from 'bluebird';
import {ClientAddMembershipListenerCodec} from '../codec/ClientAddMembershipListenerCodec';
import ClientMessage = require('../ClientMessage');
import {Member} from '../core/Member';
import {LoggingService} from '../logging/LoggingService';
import {EventEmitter} from 'events';
import {ClientInfo} from '../ClientInfo';
import HazelcastClient from '../HazelcastClient';

const MEMBER_ADDED = 1;
const MEMBER_REMOVED = 2;

const EMIT_MEMBER_ADDED = 'memberAdded';
const EMIT_MEMBER_REMOVED = 'memberRemoved';
const EMIT_ATTRIBUTE_CHANGE = 'memberAttributeChange';
const ATTRIBUTE_CHANGE: {[key: string]: string} = {
    1: 'put',
    2: 'remove'
};

/**
 * Manages the relationship of this client with the cluster.
 */
class ClusterService extends EventEmitter {

    /**
     * The unique identifier of the owner server node. This node is responsible for resource cleanup
     */
    public ownerUuid: string = null;

    /**
     * The unique identifier of this client instance. Assigned by owner node on authentication
     */
    public uuid: string = null;

    private knownAddresses: Address[] = [];
    private members: Member[] = [];

    private client: HazelcastClient;
    private ownerConnection: ClientConnection;
    private logger = LoggingService.getLoggingService();

    constructor(client: HazelcastClient) {
        super();
        this.client = client;
        this.members = [];
    }

    /**
     * Starts cluster service.
     * @returns
     */
    start(): Promise<void> {
        this.initHeartbeatListener();
        this.initConnectionListener();
        return this.connectToCluster();
    }

    /**
     * Connects to cluster. It uses the addresses provided in the configuration.
     * @returns
     */
    connectToCluster(): Promise<void> {
        if (this.members.length > 0) {
            this.knownAddresses = new Array<Address>();
            this.members.forEach((member: Member) => {
                this.knownAddresses.push(member.address);
            });
        } else {
            this.knownAddresses = this.client.getConfig().networkConfig.addresses;
        }
        var deferred = Promise.defer<void>();
        var attemptLimit = this.client.getConfig().networkConfig.connectionAttemptLimit;
        var attemptPeriod = this.client.getConfig().networkConfig.connectionAttemptPeriod;
        this.tryAddressIndex(0, attemptLimit, attemptPeriod, deferred);

        return deferred.promise;
    }

    /**
     * Returns the list of members in the cluster.
     * @returns
     */
    getMembers() {
        return this.members;
    }

    /**
     * Returns the number of nodes in cluster.
     * @returns {number}
     */
    getSize() {
        return this.members.length;
    }

    /**
     * Returns information about this client.
     * @returns {ClientInfo}
     */
    getClientInfo(): ClientInfo {
        var info = new ClientInfo();
        info.uuid = this.uuid;
        info.localAddress = this.getOwnerConnection().getLocalAddress();
        return info;
    }

    private initHeartbeatListener() {
        this.client.getHeartbeat().addListener({
            onHeartbeatStopped: this.onHeartbeatStopped.bind(this)
        });
    }

    private initConnectionListener() {
        this.client.getConnectionManager().on('connectionClosed', this.onConnectionClosed.bind(this));
    }

    private onConnectionClosed(connection: ClientConnection) {
        this.logger.warn('ClusterService', 'Connection closed to ' + Address.encodeToString(connection.address));
        if (connection.address === this.getOwnerConnection().address) {
            this.ownerConnection = null;
            this.connectToCluster().catch(this.client.shutdown.bind(this.client));
        }
    }

    private onHeartbeatStopped(connection: ClientConnection): void {
        this.logger.warn('ClusterService', Address.encodeToString(connection.address) + ' stopped heartbeating.');
        if (connection.getAddress() === this.ownerConnection.address) {
            this.client.getConnectionManager().destroyConnection(connection.address);
        }
    }

    private tryAddressIndex(index: number
        , attemptLimit: number
        , attemptPeriod: number
        , deferred: Promise.Resolver<void>) {
        setImmediate(() => {
            if (this.knownAddresses.length <= index) {
                attemptLimit = attemptLimit - 1;
                if (attemptLimit === 0) {
                    var error = new Error('Unable to connect to any of the following addresses ' + this.knownAddresses);
                    deferred.reject(error);
                    return;
                } else {
                    setTimeout(this.tryAddressIndex(0, attemptLimit, attemptPeriod, deferred), attemptPeriod);
                }
            } else {
                var currentAddress = this.knownAddresses[index];
                this.client.getConnectionManager().getOrConnect(currentAddress, true)
                    .then((connection: ClientConnection) => {
                    this.ownerConnection = connection;
                    this.initMemberShipListener().then(() => {
                        deferred.resolve();
                    });
                }).catch((e) => {
                    this.logger.warn('ClusterService', e);
                    this.tryAddressIndex(index + 1, attemptLimit, attemptPeriod, deferred);
                });
            }
        });
    }

    /**
     * Returns the connection associated with owner node of this client.
     * @returns {ClientConnection}
     */
    getOwnerConnection(): ClientConnection {
        return this.ownerConnection;
    }

    initMemberShipListener(): Promise<void> {
        var request = ClientAddMembershipListenerCodec.encodeRequest(false);

        var handler = (m: ClientMessage) => {
            var handleMember = this.handleMember.bind(this);
            var handleMemberList = this.handleMemberList.bind(this);
            var handleAttributeChange = this.handleMemberAttributeChange.bind(this);
            ClientAddMembershipListenerCodec.handle(m, handleMember, handleMemberList, handleAttributeChange, null);
        };
        return this.client.getInvocationService().invokeOnConnection(this.getOwnerConnection(), request, handler)
            .then((resp: ClientMessage) => {
                this.logger.trace('ClusterService', 'Registered listener with id '
                    + ClientAddMembershipListenerCodec.decodeResponse(resp).response);
            });
    }

    private handleMember(member: Member, eventType: number) {
        if (eventType === MEMBER_ADDED) {
            this.logger.info('ClusterService', member.toString() + ' added to cluster');
            this.memberAdded(member);
        } else if (eventType === MEMBER_REMOVED) {
            this.logger.info('ClusterService', member.toString() + ' removed from cluster');
            this.memberRemoved(member);
        }
        this.client.getPartitionService().refresh();
    }

    private handleMemberList(members: Member[]) {
        this.members = members;
        this.client.getPartitionService().refresh();
        this.logger.info('ClusterService', 'Members received.', this.members);
    }

    private handleMemberAttributeChange(uuid: string, key: string, operationType: number, value: string) {
        this.emit(EMIT_ATTRIBUTE_CHANGE, uuid, key, ATTRIBUTE_CHANGE[operationType], value);
    }

    private memberAdded(member: Member) {
        this.members.push(member);
        this.emit(EMIT_MEMBER_ADDED, member);
    }

    private memberRemoved(member: Member) {
        this.members.splice(this.members.indexOf(member), 1);
        this.client.getConnectionManager().destroyConnection(member.address);
        this.emit(EMIT_MEMBER_REMOVED, member);
    }
}

export = ClusterService;
