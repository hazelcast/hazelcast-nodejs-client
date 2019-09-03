import {ClientMessage, Frame} from '../ClientMessage';
import {DistributedObject} from '../DistributedObject';
import {StringCodec} from './StringCodec';
import {CodecUtil} from './CodecUtil';
import {DistributedObjectInfo} from './DistributedObjectInfo';

export class DistributedObjectInfoCodec {

    // tslint:disable-next-line:no-empty
    constructor() {
    }

    public static encode(clientMessage: ClientMessage, info: DistributedObject): void {
        clientMessage.add(ClientMessage.BEGIN_FRAME);

        StringCodec.encode(clientMessage, info.getServiceName());
        StringCodec.encode(clientMessage, info.getName());

        clientMessage.add(ClientMessage.END_FRAME);
    }

    public static decode(frame: Frame): DistributedObjectInfo {
        frame = frame.next;

        const serviceName: string = StringCodec.decode(frame);
        const name: string = StringCodec.decode(frame);

        CodecUtil.fastForwardToEndFrame(frame);

        return new DistributedObjectInfo(serviceName, name);
    }
}

//distributedobjectinfo classi olusturmalisin
//her decode icin de key ekle hem custom hem genericated
