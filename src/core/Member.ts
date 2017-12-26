import Address = require('../Address');
import {UUID} from './UUID';
export class Member {
    /**
     * Network address of member.
     */
    address: Address;
    /**
     * Unique id of member in cluster.
     */
    uuid: string;
    /**
     * true if member is a lite member.
     */
    isLiteMember: boolean;
    attributes: {[id: string]: string};

    constructor(address: Address, uuid: string, isLiteMember = false, attributes: {[id: string]: string} = {}) {
        this.address = address;
        this.uuid = uuid;
        this.isLiteMember = isLiteMember;
        this.attributes = attributes;
    }

    equals(other: Member): boolean {
        if (other === this) {
            return true;
        }
        if (other == null) {
            return false;
        }
        if (other.address.equals(this.address) && other.uuid === this.uuid && other.isLiteMember === this.isLiteMember) {
            return true;
        }
        return false;
    }

    toString() {
        return 'Member[ uuid: ' + this.uuid.toString() + ', address: ' + this.address.toString() + ']';
    }
}
