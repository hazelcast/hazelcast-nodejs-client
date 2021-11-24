import {ObjectDataInput, ObjectDataOutput} from './ObjectData';

export interface AsyncSerializerAdapter {
    id: number;
    write(out: ObjectDataOutput, object: any): Promise<void>;
    read(input: ObjectDataInput): Promise<any>;
}
