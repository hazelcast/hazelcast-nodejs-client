import {ClientMessage, Frame} from '../ClientMessage';
import {Data} from '../serialization/Data';
import {HeapData} from '../serialization/HeapData';

export class DataCodec {

    // tslint:disable-next-line:no-empty
    constructor() {
    }

    public static encode(clientMessage: ClientMessage, data: Data): void {
        clientMessage.add(new Frame(data.toBuffer()));
    }

    public static decode(frame: Frame): Data {
        return new HeapData(frame.content);
    }

}
