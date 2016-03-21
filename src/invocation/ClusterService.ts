import ClientConnection = require('./ClientConnection');
import HazelcastClient = require('../HazelcastClient');
import Address = require('../Address');
import Q = require('q');
import {AddMembershipListenerCodec} from '../codec/AddMembershipListenerCodec';
import ClientMessage = require('../ClientMessage');
import {Member} from '../Member';

const MEMBER_ADDED = 1;
const MEMBER_REMOVED = 2;

class ClusterService {

    private addresses: Address[];
    private members: Member[];

    private client: HazelcastClient;
    private ownerConnection: ClientConnection;

    constructor(client: HazelcastClient) {
        this.client = client;
        this.addresses = client.getConfig().networkConfig.addresses;
        this.members = [];
    }

    start(): Q.Promise<ClusterService> {
        this.initHeartbeatListener();
        this.initConnectionListener();
        return this.connectToCluster();
    }

    connectToCluster() {
        var deferred = Q.defer<ClusterService>();
        var attemptLimit = this.client.getConfig().networkConfig.connectionAttemptLimit;
        var attemptPeriod = this.client.getConfig().networkConfig.connectionAttemptPeriod;
        var attempt = 1;

        this.tryAddressIndex(0, attemptLimit, attemptPeriod, deferred);

        return deferred.promise;
    }

    private initHeartbeatListener() {
        this.client.getHeartbeat().addListener({
            onHeartbeatStopped: this.onHeartbeatStopped.bind(this)
        });
    }

    private initConnectionListener() {
        this.client.getConnectionManager().addListener({
            onConnectionClosed: this.onConnectionClosed.bind(this)
        });
    }

    private onConnectionClosed(connection: ClientConnection) {
        if (connection.address === this.getOwnerConnection().address) {
            this.ownerConnection = null;
            console.log('ClusterService: connection closed: ' + connection.address.toString());
            this.connectToCluster();
        }
    }

    private onHeartbeatStopped(connection: ClientConnection): void {
        if (connection.getAddress() === this.ownerConnection.address) {
            this.client.getConnectionManager().destroyConnection(connection.address);
        }
        console.log('Cluster service ' + connection.address + ' stopped heartbeating');
    }

    private tryAddressIndex(index: number
        , attemptLimit: number
        , attemptPeriod: number
        , deferred: Q.Deferred<ClusterService>) {
        setImmediate(() => {
            var currentAddress = this.addresses[index];
            this.client.getConnectionManager().getOrConnect(currentAddress).then((connection: ClientConnection) => {
                this.ownerConnection = connection;
                this.initMemberShipListener().then(() => {
                    deferred.resolve(this);
                });
            }).catch((e) => {
                console.log(e);
                if (index === this.addresses.length) {
                    attemptLimit = attemptLimit - 1;
                    if (attemptLimit === 0) {
                        var error = new Error('Unable to connect to any of the following addresses ' + this.addresses);
                        deferred.reject(error);
                        return;
                    } else {
                        setTimeout(this.tryAddressIndex(0, attemptLimit, attemptPeriod, deferred), attemptPeriod);
                    }
                }
                this.tryAddressIndex(index + 1, attemptLimit, attemptPeriod, deferred);
            });
        });
    }

    getOwnerConnection(): ClientConnection {
        return this.ownerConnection;
    }

    initMemberShipListener(): Q.Promise<void> {
        var deferred = Q.defer<void>();
        var request = AddMembershipListenerCodec.encodeRequest(false);

        var handler = (m: ClientMessage) => {
            var handleMember = this.handleMember.bind(this);
            var handleMemberList = this.handleMemberList.bind(this);
            AddMembershipListenerCodec.handle(m, handleMember, handleMemberList, null, null);
        };

        this.client.getInvocationService().invokeOnConnection(this.getOwnerConnection(), request, handler)
            .then((resp: ClientMessage) => {
                console.log('registered listener with id ' + AddMembershipListenerCodec.decodeResponse(resp).response);
                deferred.resolve();
            });

        return deferred.promise;
    }

    private handleMember(member: Member, eventType: number) {
        if (eventType === MEMBER_ADDED) {
            this.memberAdded(member);
        } else if (eventType === MEMBER_REMOVED) {
            this.memberRemoved(member);
        }
        this.client.getPartitionService().refresh();
        console.log(this.members);
    }

    private handleMemberList(members: Member[]) {
        this.members = members;
        this.client.getPartitionService().refresh();
        console.log(this.members);
    }

    private memberAdded(member: Member) {
        this.members.push(member);
    }

    private memberRemoved(member: Member) {
        this.members.splice(this.members.indexOf(member), 1);
    }
}

export = ClusterService
