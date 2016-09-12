import {IdentifiedDataSerializable} from './serialization/Serializable';
import {DataInput, DataOutput} from './serialization/Data';
import {ADDRESS_CLASS_ID, CLUSTER_DATA_FACTORY_ID} from './ClusterDataFactory';

class Address implements IdentifiedDataSerializable {

    host: string;
    port: number;

    static encodeToString(address: Address): string {
        return address.host + ':' + address.port;
    }

    constructor(host?: string, port?: number) {
        this.host = host;
        this.port = port;
    }


    readData(input: DataInput): any {
        this.port = input.readInt();
        // IPv4 or IPv6 - not used here
        input.readByte();
        this.host = input.readUTF();
    }

    writeData(output: DataOutput): void {
        output.writeInt(this.port);
        output.writeByte(4);
        output.writeUTF(this.host);
    }

    getFactoryId(): number {
        return CLUSTER_DATA_FACTORY_ID;
    }

    getClassId(): number {
        return ADDRESS_CLASS_ID;
    }
}

export = Address;
