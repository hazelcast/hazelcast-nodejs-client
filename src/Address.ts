class Address {
    host: string;
    port: number;

    static encodeToString(address: Address): string {
        return address.host + ':' + address.port;
    }

    constructor(host: string, port: number) {
        this.host = host;
        this.port = port;
    }
}

export = Address;
