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
    private ready = Q.defer<ClusterService>();
    private ownerConnection: ClientConnection;

    constructor(client: HazelcastClient) {
        this.client = client;
        this.addresses = client.getConfig().networkConfig.addresses;
        this.members = [];
    }

    start(): Q.Promise<ClusterService> {
        this.tryAddress(0);
        return this.ready.promise;
    }

    private tryAddress(index: number) {
        if (index >= this.addresses.length) {
            var error = new Error('Unable to connect to any of the following addresses ' + this.addresses);
            this.ready.reject(error);
        }

        var currentAddress = this.addresses[index];

        this.client.getConnectionManager().getOrConnect(currentAddress).then((connection: ClientConnection) => {
            this.ownerConnection = connection;
            this.initMemberShipListener().then(() => {
                this.ready.resolve(this);
            });
        }).catch((e) => {
            console.log('An error occurred while connecting to: ' + currentAddress);
            console.log(e);
            this.tryAddress(index + 1);
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

        this.client.getInvocationService().invokeOnConnection(
            this.getOwnerConnection()
            , request
            , handler
        ).then((resp) => {
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
