import {ClientMessage, Frame} from "../ClientMessage";
import {DistributedObject} from "/Users/gulcesirvanci/Desktop/hazelcast-nodejs-client/lib/DistributedObject";
import {HeapData} from "/Users/gulcesirvanci/Desktop/hazelcast-nodejs-client/lib/serialization/HeapData";
import {StringCodec} from "./StringCodec";
import {CodecUtil} from "./CodecUtil";

export class DistributedObjectInfoCodec {

    constructor() {
    }

    public static encode(clientMessage: ClientMessage, info: DistributedObject): void {
        clientMessage.add(ClientMessage.BEGIN_FRAME);

        StringCodec.encode(clientMessage, info.getServiceName());
        StringCodec.encode(clientMessage, info.getName());

        clientMessage.add(ClientMessage.END_FRAME);
    }

    public static decode(frame : Frame) : DistributedObject{
    // begin frame
    frame = frame.next;

    var serviceName : string = StringCodec.decode(frame);
    var name : string = StringCodec.decode(frame);

    CodecUtil.fastForwardToEndFrame(frame);

    return new DistributedObject(serviceName, name);
}
}

//distributedobjectinfo classi olusturmalisin
//her decode icin de key ekle hem custom hem genericated


