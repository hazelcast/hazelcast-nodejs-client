
export class DistributedObjectInfo {

    private serviceName: string;
    private name: string;

    constructor(serviceName: string, name: string) {
        this.serviceName = serviceName;
        this.name = name;
    }

    public getServiceName(): string {
        return this.serviceName;
    }

    public getName(): string {
        return this.name;
    }

}
