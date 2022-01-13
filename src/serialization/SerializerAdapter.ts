import {ObjectDataInput, ObjectDataOutput} from './ObjectData';

export interface SerializerAdapter {
    id: number;
    write(out: ObjectDataOutput, object: any): void;
    read(input: ObjectDataInput): any;
}
