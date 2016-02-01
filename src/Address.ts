class Address {
    public host: string;
    public port: number;

    constructor(host: string, port: number) {
        this.host = host;
        this.port = port;
    }

    public toString(): string {
        return this.host + ':' + this.port;
    }
}

export = Address
