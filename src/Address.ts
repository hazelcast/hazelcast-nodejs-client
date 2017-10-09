import {IdentifiedDataSerializable} from './serialization/Serializable';
import {DataInput, DataOutput} from './serialization/Data';
import {ADDRESS_CLASS_ID, CLUSTER_DATA_FACTORY_ID} from './ClusterDataFactory';
import * as net from 'net';

class Address implements IdentifiedDataSerializable {

    host: string;
    port: number;
    type: number;

    static encodeToString(address: Address): string {
        return address.host + ':' + address.port;
    }

    constructor(host?: string, port?: number) {
        this.host = host;
        this.port = port;
        if (net.isIPv6(host)) {
            this.type = 6;
        } else {
            this.type = 4;
        }
    }


    readData(input: DataInput): any {
        this.port = input.readInt();
        this.type = input.readByte();
        this.host = input.readUTF();
    }

    writeData(output: DataOutput): void {
        output.writeInt(this.port);
        output.writeByte(this.type);
        output.writeUTF(this.host);
    }

    getFactoryId(): number {
        return CLUSTER_DATA_FACTORY_ID;
    }

    getClassId(): number {
        return ADDRESS_CLASS_ID;
    }

    toString(): string {
        return this.host + ':' + this.port;
    }
}

export = Address;
