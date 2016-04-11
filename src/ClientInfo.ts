import {Socket} from 'net';
import Address = require('./Address');
export class ClientInfo {
    uuid: string;
    localAddress: Address;
    type = 'NodeJS';
}
