import {ClientMessage, Frame} from "../ClientMessage";
import {Data} from "/Users/gulcesirvanci/Desktop/hazelcast-nodejs-client/lib/serialization/Data";
import {HeapData} from "/Users/gulcesirvanci/Desktop/hazelcast-nodejs-client/lib/serialization/HeapData";

export class DataCodec {

    constructor() {
    }

    public static encode(clientMessage: ClientMessage, data: Data): void {
        clientMessage.add(new Frame(data.toBuffer()));
    }

    public static decode(frame: Frame): Data {
        return new HeapData(frame.content);
    }

}
