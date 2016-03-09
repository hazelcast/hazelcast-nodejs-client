import Address = require('./Address');
export class Member {
    address: Address;
    uuid: string;
    isLiteMember: boolean;
    attributes: {[id: string]: string};

    constructor(address: Address, uuid: string, isLiteMember = false, attributes: {[id: string]: string} = {}) {
        this.address = address;
        this.uuid = uuid;
        this.isLiteMember = isLiteMember;
        this.attributes = attributes;
    }

    toString() {
        return this.address;
    }
}
