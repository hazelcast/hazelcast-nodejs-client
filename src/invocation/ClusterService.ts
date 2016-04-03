import ClientConnection = require('./ClientConnection');
import HazelcastClient = require('../HazelcastClient');
import Address = require('../Address');
import Q = require('q');
import {ClientAddMembershipListenerCodec} from '../codec/ClientAddMembershipListenerCodec';
import ClientMessage = require('../ClientMessage');
import {Member} from '../Member';
import {LoggingService} from '../LoggingService';

const MEMBER_ADDED = 1;
const MEMBER_REMOVED = 2;

class ClusterService {

    private addresses: Address[];
    private members: Member[];

    private client: HazelcastClient;
    private ownerConnection: ClientConnection;
    private logger = LoggingService.getLoggingService();

    constructor(client: HazelcastClient) {
        this.client = client;
        this.addresses = client.getConfig().networkConfig.addresses;
        this.members = [];
    }

    start(): Q.Promise<void> {
        this.initHeartbeatListener();
        this.initConnectionListener();
        return this.connectToCluster();
    }

    connectToCluster(): Q.Promise<void> {
        var deferred = Q.defer<void>();
        var attemptLimit = this.client.getConfig().networkConfig.connectionAttemptLimit;
        var attemptPeriod = this.client.getConfig().networkConfig.connectionAttemptPeriod;

        this.tryAddressIndex(0, attemptLimit, attemptPeriod, deferred);

        return deferred.promise;
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
        this.logger.warn('ClusterService', 'Connection closed to ' + connection.address);
        if (connection.address === this.getOwnerConnection().address) {
            this.ownerConnection = null;
            this.connectToCluster();
        }
    }

    private onHeartbeatStopped(connection: ClientConnection): void {
        this.logger.warn('ClusterService', connection.address + ' stopped heartbeating.');
        if (connection.getAddress() === this.ownerConnection.address) {
            this.client.getConnectionManager().destroyConnection(connection.address);
        }
    }

    private tryAddressIndex(index: number
        , attemptLimit: number
        , attemptPeriod: number
        , deferred: Q.Deferred<void>) {
        setImmediate(() => {
            if (this.addresses.length <= index) {
                attemptLimit = attemptLimit - 1;
                if (attemptLimit === 0) {
                    var error = new Error('Unable to connect to any of the following addresses ' + this.addresses);
                    deferred.reject(error);
                    return;
                } else {
                    setTimeout(this.tryAddressIndex(0, attemptLimit, attemptPeriod, deferred), attemptPeriod);
                }
            } else {
                var currentAddress = this.addresses[index];
                this.client.getConnectionManager().getOrConnect(currentAddress).then((connection: ClientConnection) => {
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

    getOwnerConnection(): ClientConnection {
        return this.ownerConnection;
    }

    initMemberShipListener(): Q.Promise<void> {
        var deferred = Q.defer<void>();
        var request = ClientAddMembershipListenerCodec.encodeRequest(false);

        var handler = (m: ClientMessage) => {
            var handleMember = this.handleMember.bind(this);
            var handleMemberList = this.handleMemberList.bind(this);
            ClientAddMembershipListenerCodec.handle(m, handleMember, handleMemberList, null, null);
        };
        this.client.getInvocationService().invokeOnConnection(this.getOwnerConnection(), request, handler)
            .then((resp: ClientMessage) => {
                this.logger.trace('ClusterService', 'Registered listener with id '
                    + ClientAddMembershipListenerCodec.decodeResponse(resp).response);
                deferred.resolve();
            });
        return deferred.promise;
    }

    private handleMember(member: Member, eventType: number) {
        if (eventType === MEMBER_ADDED) {
            this.logger.info('ClusterService', member + ' added to cluster');
            this.memberAdded(member);
        } else if (eventType === MEMBER_REMOVED) {
            this.logger.info('ClusterService', member + ' removed from cluster');
            this.memberRemoved(member);
        }
        this.client.getPartitionService().refresh();
    }

    private handleMemberList(members: Member[]) {
        this.members = members;
        this.client.getPartitionService().refresh();
        this.logger.info('ClusterService', 'Members received.', this.members);
    }

    private memberAdded(member: Member) {
        this.members.push(member);
    }

    private memberRemoved(member: Member) {
        this.members.splice(this.members.indexOf(member), 1);
    }
}

export = ClusterService
