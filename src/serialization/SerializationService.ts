import {Data} from './Data';
import {HeapData} from './HeapData';
export interface SerializationService {
    toData(object: any) : Data;

    toObject(data: Data) : any;
}

export class JsonSerializationService implements SerializationService {
    public toData(object: any): Data {
        var jsonString: string = JSON.stringify(object);
        var buffer = new Buffer(12 + Buffer.byteLength(jsonString, 'utf8'));
        buffer.writeInt32BE(0, 0); // partition hash
        buffer.writeInt32BE(-11, 4); //string serializer
        buffer.writeInt32BE(jsonString.length, 8);
        buffer.write(jsonString, 12);

        return new HeapData(buffer);
    }

    public toObject(data: Data): any {
        if (data == null) {
            return null;
        }
        return JSON.parse(data.toBuffer().toString('utf8', 12));
    }
}
