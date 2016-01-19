import {Data} from './Data';
export interface SerializationService {
    toData(object: any) : Data;

    toObject(data : Data) : any;
}
