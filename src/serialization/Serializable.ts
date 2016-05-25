import {DataInput, DataOutput} from './Data';
import {PortableWriter, PortableReader} from './Portable';
export interface IdentifiedDataSerializable {
    readData(input: DataInput): any;
    writeData(output: DataOutput): void;
    getFactoryId(): number;
    getClassId(): number;
}

export interface IdentifiedDataSerializableFactory {
    create(type: number): IdentifiedDataSerializable;
}

export interface Portable {
    getFactoryId(): number;
    getClassId(): number;
    writePortable(writer: PortableWriter): void;
    readPortable(reader: PortableReader): void;
}

export interface PortableFactory {
    create(classId: number): Portable;
}
