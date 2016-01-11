export class SerializationService {
    toData(object: any) : Buffer {
        var jsonObject : string = JSON.stringify(object);
        var buffer : Buffer = new Buffer(jsonObject);
        return buffer;
    }

    toObject(buffer : Buffer) : any {
        return JSON.parse(buffer.toString());
    }
}
