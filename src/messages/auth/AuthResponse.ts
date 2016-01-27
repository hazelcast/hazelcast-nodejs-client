import Address = require('../../Address');

class AuthResponse {

    public status: number;
    public address: Address;
    public uuid: string;
    public ownerUuid: string;
    public serializationVersion: number;

    constructor(status: number, address: Address, uuid: string, ownerUuid: string, serializationVersion: number) {
        this.status = status;
        this.address = address;
        this.uuid = uuid;
        this.ownerUuid = ownerUuid;
        this.serializationVersion = serializationVersion;
    }
}

export = AuthResponse
