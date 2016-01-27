class AuthRequest {

    public group: string;
    public password: string;
    public ownerConnection: boolean;
    public uuid: string;
    public ownerUuid: string;
    public clientType: string;
    public serializationVersion: number;

    constructor(group: string, password: string, ownerConnection: boolean,
                uuid: string, ownerUuid: string,
                clientType: string, serializationVersion: number) {
        this.group = group;
        this.password = password;
        this.ownerConnection = ownerConnection;
        this.uuid = uuid;
        this.ownerUuid = ownerUuid;
        this.clientType = clientType;
        this.serializationVersion = serializationVersion;
    }

}

export = AuthRequest
