import {DataInput, DataOutput} from './Data';
export interface IdentifiedDataSerializable {
    readData(input: DataInput): any;
    writeData(output: DataOutput): void;
    getFactoryId(): number;
    getClassId(): number;
}

export interface IdentifiedDataSerializableFactory {
    create(type: number): IdentifiedDataSerializable;
}

